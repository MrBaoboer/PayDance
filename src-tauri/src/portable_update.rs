// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
use std::{
    ffi::OsString,
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::{
        Arc,
        atomic::{AtomicBool, AtomicU8, AtomicU64, Ordering},
    },
};
use tauri::AppHandle;
#[cfg(windows)]
use tauri::{Emitter, Manager};
#[cfg(windows)]
use tauri_plugin_updater::UpdaterExt;

#[cfg(windows)]
const UPDATE_PROGRESS_EVENT: &str = "portable-update-progress";
#[cfg(windows)]
const UNKNOWN_TOTAL_PROGRESS_STEP_BYTES: u64 = 64 * 1024;
#[cfg(windows)]
static UPDATE_IN_PROGRESS: AtomicBool = AtomicBool::new(false);

#[cfg(windows)]
struct UpdateInProgressGuard;

#[cfg(windows)]
impl UpdateInProgressGuard {
    fn try_acquire() -> Option<Self> {
        UPDATE_IN_PROGRESS
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .ok()
            .map(|_| Self)
    }
}

#[cfg(windows)]
impl Drop for UpdateInProgressGuard {
    fn drop(&mut self) {
        UPDATE_IN_PROGRESS.store(false, Ordering::Release);
    }
}

#[cfg(windows)]
fn is_stale_update_artifact_name(name: &str) -> bool {
    (name.starts_with(".paydance-update-") && name.ends_with(".new"))
        || (name.starts_with(".paydance-update-probe-") && name.ends_with(".tmp"))
        || (name.contains(".paydance-backup-") && name.ends_with(".old"))
}

#[cfg(windows)]
fn cleanup_stale_update_artifacts_in(install_dir: &Path) {
    let Ok(entries) = fs::read_dir(install_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        if is_stale_update_artifact_name(name) {
            let _ = fs::remove_file(path);
        }
    }
}

pub(crate) fn cleanup_stale_update_artifacts() {
    #[cfg(windows)]
    if let Ok(current_exe) = std::env::current_exe()
        && let Some(install_dir) = current_exe.parent()
    {
        cleanup_stale_update_artifacts_in(install_dir);
    }
}

#[cfg(windows)]
fn should_emit_unknown_total_progress(total_downloaded: u64, last_reported: &AtomicU64) -> bool {
    let mut previous = last_reported.load(Ordering::Relaxed);
    loop {
        if previous > 0
            && total_downloaded.saturating_sub(previous) < UNKNOWN_TOTAL_PROGRESS_STEP_BYTES
        {
            return false;
        }
        match last_reported.compare_exchange_weak(
            previous,
            total_downloaded,
            Ordering::Relaxed,
            Ordering::Relaxed,
        ) {
            Ok(_) => return true,
            Err(current) => previous = current,
        }
    }
}

#[cfg(windows)]
#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PortableUpdateProgress {
    downloaded: u64,
    total: Option<u64>,
    percent: Option<u8>,
}

#[derive(serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub(crate) enum PortableUpdateResult {
    UpToDate,
}

#[cfg(windows)]
fn set_file_hidden(path: &Path) {
    use std::os::windows::{ffi::OsStrExt, fs::MetadataExt};

    const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn SetFileAttributesW(lp_file_name: *const u16, dw_file_attributes: u32) -> i32;
    }

    let existing_attrs = fs::metadata(path)
        .map(|meta| meta.file_attributes())
        .unwrap_or(0);
    let wide: Vec<u16> = path
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    // SAFETY: `wide` is a NUL-terminated UTF-16 buffer valid for the duration of the Win32 call.
    unsafe {
        SetFileAttributesW(wide.as_ptr(), existing_attrs | FILE_ATTRIBUTE_HIDDEN);
    }
}

#[cfg(windows)]
fn probe_install_dir(install_dir: &Path) -> Result<(), String> {
    let probe_path = install_dir.join(format!(".paydance-update-probe-{}.tmp", std::process::id()));

    fs::write(&probe_path, b"paydance-update-probe")
        .map_err(|error| format!("Install directory is not writable: {error}"))?;
    set_file_hidden(&probe_path);
    fs::remove_file(&probe_path)
        .map_err(|error| format!("Unable to remove update probe: {error}"))?;

    Ok(())
}

#[cfg(windows)]
fn sanitize_update_version(version: &str) -> String {
    version
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '.' | '-' | '_') {
                ch
            } else {
                '-'
            }
        })
        .collect()
}

#[cfg(windows)]
fn safe_update_dir(version: &str) -> PathBuf {
    let safe_version = sanitize_update_version(version);
    std::env::temp_dir().join(format!(
        "paydance-portable-update-{}-{safe_version}",
        std::process::id()
    ))
}

#[cfg(windows)]
fn is_windows_executable(bytes: &[u8]) -> bool {
    bytes.len() >= 2 && bytes.starts_with(b"MZ")
}

#[cfg(windows)]
fn resolve_powershell_path() -> PathBuf {
    if let Some(system_root) = std::env::var_os("SystemRoot") {
        let candidate = PathBuf::from(system_root)
            .join("System32")
            .join("WindowsPowerShell")
            .join("v1.0")
            .join("powershell.exe");
        if candidate.is_file() {
            return candidate;
        }
    }

    PathBuf::from("powershell.exe")
}

#[cfg(windows)]
fn portable_update_script() -> &'static str {
    r#"
param(
  [Parameter(Mandatory=$true)][int]$ProcessId,
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Destination,
  [Parameter(Mandatory=$true)][string]$UpdateDir
)
$ErrorActionPreference = 'Stop'
$Backup = "$Destination.paydance-backup-$ProcessId.old"
try {
  Wait-Process -Id $ProcessId -Timeout 30
} catch {
}
$replaced = $false
for ($i = 0; $i -lt 120; $i++) {
  $movedOld = $false
  try {
    if (Test-Path -LiteralPath $Backup) {
      Remove-Item -LiteralPath $Backup -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $Destination) {
      Move-Item -LiteralPath $Destination -Destination $Backup -Force
      try {
        $bakItem = Get-Item -LiteralPath $Backup -Force
        $bakItem.Attributes = $bakItem.Attributes -bor [IO.FileAttributes]::Hidden
      } catch {
      }
      $movedOld = $true
    }
    Move-Item -LiteralPath $Source -Destination $Destination -Force
    try {
      $destItem = Get-Item -LiteralPath $Destination -Force
      $destItem.Attributes = $destItem.Attributes -band (-bnot [IO.FileAttributes]::Hidden)
    } catch {
    }
    $replaced = $true
    break
  } catch {
    if ($movedOld -and -not (Test-Path -LiteralPath $Destination) -and (Test-Path -LiteralPath $Backup)) {
      try {
        Move-Item -LiteralPath $Backup -Destination $Destination -Force
        $restoredItem = Get-Item -LiteralPath $Destination -Force
        $restoredItem.Attributes = $restoredItem.Attributes -band (-bnot [IO.FileAttributes]::Hidden)
      } catch {
      }
    }
    Start-Sleep -Milliseconds 250
  }
}
if (-not $replaced) {
  Remove-Item -LiteralPath $Source -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $PSCommandPath -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $UpdateDir -Force -Recurse -ErrorAction SilentlyContinue
  exit 1
}
$launched = $false
for ($j = 0; $j -lt 10; $j++) {
  try {
    Start-Process -FilePath $Destination
    $launched = $true
    break
  } catch {
    Start-Sleep -Milliseconds 300
  }
}
Remove-Item -LiteralPath $Backup -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $PSCommandPath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $UpdateDir -Force -Recurse -ErrorAction SilentlyContinue
if ($launched) {
  exit 0
}
exit 1
"#
}

#[cfg(windows)]
fn stage_portable_update(
    bytes: &[u8],
    version: &str,
    install_dir: &Path,
) -> Result<(PathBuf, PathBuf, PathBuf), String> {
    if !is_windows_executable(bytes) {
        return Err("Downloaded update is not a Windows executable.".to_string());
    }

    let update_dir = safe_update_dir(version);
    fs::create_dir_all(&update_dir)
        .map_err(|error| format!("Unable to create update directory: {error}"))?;

    // Stage the executable inside install_dir so Move-Item is a same-volume atomic rename.
    let staged_exe = install_dir.join(format!(".paydance-update-{}.new", std::process::id()));
    let script_path = update_dir.join("apply-update.ps1");

    fs::write(&staged_exe, bytes)
        .map_err(|error| format!("Unable to stage update executable: {error}"))?;
    set_file_hidden(&staged_exe);
    if let Err(error) = fs::write(&script_path, portable_update_script()) {
        let _ = fs::remove_file(&staged_exe);
        return Err(format!("Unable to stage update script: {error}"));
    }

    Ok((staged_exe, script_path, update_dir))
}

#[cfg(windows)]
fn portable_update_helper_args(
    process_id: u32,
    script_path: &Path,
    staged_exe: &Path,
    current_exe: &Path,
    update_dir: &Path,
) -> Vec<OsString> {
    vec![
        OsString::from("-NoProfile"),
        OsString::from("-ExecutionPolicy"),
        OsString::from("Bypass"),
        OsString::from("-File"),
        script_path.as_os_str().to_owned(),
        OsString::from("-ProcessId"),
        OsString::from(process_id.to_string()),
        OsString::from("-Source"),
        staged_exe.as_os_str().to_owned(),
        OsString::from("-Destination"),
        current_exe.as_os_str().to_owned(),
        OsString::from("-UpdateDir"),
        update_dir.as_os_str().to_owned(),
    ]
}

#[cfg(windows)]
fn spawn_portable_update_helper(
    script_path: &Path,
    staged_exe: &Path,
    current_exe: &Path,
    update_dir: &Path,
) -> Result<(), String> {
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    Command::new(resolve_powershell_path())
        .args(portable_update_helper_args(
            std::process::id(),
            script_path,
            staged_exe,
            current_exe,
            update_dir,
        ))
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|error| format!("Unable to start update helper: {error}"))?;

    Ok(())
}

#[cfg(windows)]
#[tauri::command]
pub(crate) async fn install_portable_update(
    app: AppHandle,
) -> Result<PortableUpdateResult, String> {
    let _in_progress = UpdateInProgressGuard::try_acquire()
        .ok_or_else(|| "An update is already in progress.".to_string())?;

    let current_exe =
        std::env::current_exe().map_err(|error| format!("Unable to locate app exe: {error}"))?;
    let install_dir = current_exe
        .parent()
        .ok_or_else(|| "Unable to locate app directory.".to_string())?;
    // Fail fast on read-only directories before spending bandwidth downloading the EXE.
    probe_install_dir(install_dir)?;

    let update = app
        .updater()
        .map_err(|error| format!("Unable to initialize updater: {error}"))?
        .check()
        .await
        .map_err(|error| format!("Unable to check update: {error}"))?;

    let Some(update) = update else {
        return Ok(PortableUpdateResult::UpToDate);
    };

    let version = update.version.clone();
    let downloaded_bytes = Arc::new(AtomicU64::new(0));
    let last_reported_percent = Arc::new(AtomicU8::new(u8::MAX));
    let last_reported_bytes = Arc::new(AtomicU64::new(0));
    let progress_app = app.clone();
    let downloaded_for_chunk = Arc::clone(&downloaded_bytes);
    let reported_for_chunk = Arc::clone(&last_reported_percent);
    let reported_bytes_for_chunk = Arc::clone(&last_reported_bytes);

    let bytes = update
        .download(
            move |chunk_length, content_length| {
                let total_downloaded = downloaded_for_chunk
                    .fetch_add(chunk_length as u64, Ordering::Relaxed)
                    + chunk_length as u64;
                let percent = content_length
                    .and_then(|total| total_downloaded.saturating_mul(100).checked_div(total))
                    .map(|value| value.min(100) as u8);
                let should_emit = match percent {
                    Some(pct) => reported_for_chunk.swap(pct, Ordering::Relaxed) != pct,
                    None => should_emit_unknown_total_progress(
                        total_downloaded,
                        &reported_bytes_for_chunk,
                    ),
                };
                if should_emit && let Some(main_window) = progress_app.get_webview_window("main") {
                    let _ = main_window.emit(
                        UPDATE_PROGRESS_EVENT,
                        PortableUpdateProgress {
                            downloaded: total_downloaded,
                            total: content_length,
                            percent,
                        },
                    );
                }
            },
            || {},
        )
        .await
        .map_err(|error| format!("Unable to download update: {error}"))?;

    let (staged_exe, script_path, update_dir) =
        stage_portable_update(&bytes, &version, install_dir)?;
    if let Err(error) =
        spawn_portable_update_helper(&script_path, &staged_exe, &current_exe, &update_dir)
    {
        let _ = fs::remove_file(&staged_exe);
        let _ = fs::remove_dir_all(&update_dir);
        return Err(error);
    }

    app.cleanup_before_exit();
    std::process::exit(0);
}

#[cfg(not(windows))]
#[tauri::command]
pub(crate) async fn install_portable_update(
    _app: AppHandle,
) -> Result<PortableUpdateResult, String> {
    Err("Portable updates are only available on Windows.".to_string())
}

#[cfg(all(test, windows))]
mod tests {
    use super::*;

    #[test]
    fn sanitizes_update_versions_for_temp_directory_names() {
        assert_eq!(
            sanitize_update_version("v1.2.3 beta/../x"),
            "v1.2.3-beta-..-x"
        );
    }

    #[test]
    fn accepts_only_windows_executable_payloads() {
        assert!(is_windows_executable(b"MZ\x90\0"));
        assert!(!is_windows_executable(b"PK\x03\x04"));
        assert!(!is_windows_executable(b"M"));
    }

    #[test]
    fn keeps_helper_paths_as_independent_arguments() {
        let args = portable_update_helper_args(
            42,
            Path::new(r"C:\Temp Folder\apply-update.ps1"),
            Path::new(r"C:\Program Files\PayDance\.paydance-update-42.new"),
            Path::new(r"C:\Program Files\PayDance\pay-dance.exe"),
            Path::new(r"C:\Temp Folder"),
        );

        assert_eq!(
            args,
            vec![
                OsString::from("-NoProfile"),
                OsString::from("-ExecutionPolicy"),
                OsString::from("Bypass"),
                OsString::from("-File"),
                OsString::from(r"C:\Temp Folder\apply-update.ps1"),
                OsString::from("-ProcessId"),
                OsString::from("42"),
                OsString::from("-Source"),
                OsString::from(r"C:\Program Files\PayDance\.paydance-update-42.new"),
                OsString::from("-Destination"),
                OsString::from(r"C:\Program Files\PayDance\pay-dance.exe"),
                OsString::from("-UpdateDir"),
                OsString::from(r"C:\Temp Folder"),
            ]
        );
    }

    #[test]
    fn probes_a_writable_install_directory_without_leaving_files() {
        let probe_dir =
            std::env::temp_dir().join(format!("paydance-probe-test-{}", std::process::id()));
        fs::create_dir_all(&probe_dir).expect("test directory should be created");

        probe_install_dir(&probe_dir).expect("writable directory should pass");

        let remaining = fs::read_dir(&probe_dir)
            .expect("test directory should be readable")
            .count();
        fs::remove_dir_all(&probe_dir).expect("test directory should be removed");
        assert_eq!(remaining, 0);
    }

    #[test]
    fn resolves_windows_powershell_from_system_root() {
        let ps_path = resolve_powershell_path();
        assert!(ps_path.ends_with("powershell.exe"));
        assert!(ps_path.is_absolute());
    }

    #[test]
    fn separates_file_replacement_from_relaunch_in_update_script() {
        let script = portable_update_script();
        let replace_done = script
            .find("$replaced = $true")
            .expect("script should mark replacement completion");
        let start_process = script
            .find("Start-Process -FilePath $Destination")
            .expect("script should relaunch destination");
        let fallback_restore = script
            .find("Move-Item -LiteralPath $Backup -Destination $Destination -Force")
            .expect("script should preserve rollback");

        assert!(fallback_restore < start_process);
        assert!(replace_done < start_process);
    }

    #[test]
    fn prevents_concurrent_update_installs_with_single_flight_guard() {
        let first = UpdateInProgressGuard::try_acquire();
        assert!(first.is_some());
        assert!(UpdateInProgressGuard::try_acquire().is_none());
        drop(first);
        assert!(UpdateInProgressGuard::try_acquire().is_some());
    }

    #[test]
    fn cleans_up_only_stale_update_artifacts() {
        let test_dir =
            std::env::temp_dir().join(format!("paydance-cleanup-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&test_dir);
        fs::create_dir_all(&test_dir).expect("test directory should be created");

        let exe_file = test_dir.join("pay-dance.exe");
        let staged_file = test_dir.join(".paydance-update-123.new");
        let probe_file = test_dir.join(".paydance-update-probe-123.tmp");
        let backup_file = test_dir.join("pay-dance.exe.paydance-backup-123.old");
        fs::write(&exe_file, b"MZ").expect("exe should be created");
        fs::write(&staged_file, b"MZ").expect("staged file should be created");
        fs::write(&probe_file, b"probe").expect("probe file should be created");
        fs::write(&backup_file, b"MZ").expect("backup file should be created");

        cleanup_stale_update_artifacts_in(&test_dir);

        assert!(exe_file.exists());
        assert!(!staged_file.exists());
        assert!(!probe_file.exists());
        assert!(!backup_file.exists());

        fs::remove_dir_all(&test_dir).expect("test directory should be removed");
    }

    #[test]
    fn throttles_progress_events_when_total_size_is_unknown() {
        let last = AtomicU64::new(0);
        assert!(should_emit_unknown_total_progress(1_024, &last));
        assert!(!should_emit_unknown_total_progress(4_096, &last));
        assert!(!should_emit_unknown_total_progress(65_000, &last));
        assert!(should_emit_unknown_total_progress(70_000, &last));
    }

    #[test]
    fn hides_temporary_update_files_and_clears_hidden_on_final_destination() {
        use std::os::windows::fs::MetadataExt;

        let test_file =
            std::env::temp_dir().join(format!("paydance-hidden-test-{}.tmp", std::process::id()));
        fs::write(&test_file, b"test").expect("temp file should be created");

        set_file_hidden(&test_file);

        let attrs = fs::metadata(&test_file)
            .expect("metadata should be readable")
            .file_attributes();
        fs::remove_file(&test_file).expect("temp file should be removed");
        assert_ne!(attrs & 0x2, 0);

        let script = portable_update_script();
        assert!(script.contains("-bor [IO.FileAttributes]::Hidden"));
        assert!(script.contains("-band (-bnot [IO.FileAttributes]::Hidden)"));
    }
}
