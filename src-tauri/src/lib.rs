// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::{
    ffi::OsString,
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::Mutex,
};
use tauri::{
    menu::MenuBuilder,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Listener, Manager, WebviewWindow,
};
use tauri_plugin_updater::UpdaterExt;

const TRAY_OPEN_SETTINGS_EVENT: &str = "tray-open-settings";
const TRAY_TOGGLE_ALWAYS_ON_TOP_EVENT: &str = "tray-toggle-always-on-top";
const TRAY_TOGGLE_MINI_MODE_EVENT: &str = "tray-toggle-mini-mode";

struct TrayState {
    handle: Mutex<Option<tauri::tray::TrayIcon>>,
}

#[derive(serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum PortableUpdateResult {
    UpToDate,
}

fn tray_menu_labels(
    use_en: bool,
) -> (
    &'static str,
    &'static str,
    &'static str,
    &'static str,
    &'static str,
) {
    if use_en {
        ("Open", "Settings", "Mini Mode", "Always on Top", "Quit")
    } else {
        ("打开主界面", "打开设置", "切换迷你模式", "切换置顶", "退出")
    }
}

fn tray_tooltip(use_en: bool) -> &'static str {
    if use_en {
        "PayDance · Desktop Real-Time Salary Dashboard"
    } else {
        "薪跳 · 桌面实时工资看板"
    }
}

fn build_tray_menu(
    app: &AppHandle,
    use_en: bool,
) -> Result<tauri::menu::Menu<tauri::Wry>, tauri::Error> {
    let (show, settings, toggle_mini, toggle_top, quit) = tray_menu_labels(use_en);
    MenuBuilder::new(app)
        .text("show", show)
        .text("settings", settings)
        .text("toggle_mini", toggle_mini)
        .separator()
        .text("toggle_top", toggle_top)
        .text("quit", quit)
        .build()
}

fn show_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg(windows)]
fn probe_install_dir(install_dir: &Path) -> Result<(), String> {
    let probe_path = install_dir.join(format!(".paydance-update-probe-{}.tmp", std::process::id()));

    fs::write(&probe_path, b"paydance-update-probe")
        .map_err(|error| format!("Unable to write update probe: {error}"))?;
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
fn portable_update_script() -> &'static str {
    r#"
param(
  [Parameter(Mandatory=$true)][int]$ProcessId,
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Destination
)
$ErrorActionPreference = 'Stop'
try {
  Wait-Process -Id $ProcessId -Timeout 30
} catch {
}
for ($i = 0; $i -lt 120; $i++) {
  try {
    Copy-Item -LiteralPath $Source -Destination $Destination -Force
    Start-Process -FilePath $Destination
    Remove-Item -LiteralPath $Source -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $PSCommandPath -Force -ErrorAction SilentlyContinue
    exit 0
  } catch {
    Start-Sleep -Milliseconds 250
  }
}
exit 1
"#
}

#[cfg(windows)]
fn stage_portable_update(bytes: &[u8], version: &str) -> Result<(PathBuf, PathBuf), String> {
    if !is_windows_executable(bytes) {
        return Err("Downloaded update is not a Windows executable.".to_string());
    }

    let current_exe =
        std::env::current_exe().map_err(|error| format!("Unable to locate app exe: {error}"))?;
    let install_dir = current_exe
        .parent()
        .ok_or_else(|| "Unable to locate app directory.".to_string())?;
    probe_install_dir(install_dir)?;

    let update_dir = safe_update_dir(version);
    fs::create_dir_all(&update_dir)
        .map_err(|error| format!("Unable to create update directory: {error}"))?;

    let staged_exe = update_dir.join("pay-dance-update.exe");
    let script_path = update_dir.join("apply-update.ps1");

    fs::write(&staged_exe, bytes)
        .map_err(|error| format!("Unable to stage update executable: {error}"))?;
    fs::write(&script_path, portable_update_script())
        .map_err(|error| format!("Unable to stage update script: {error}"))?;

    Ok((staged_exe, script_path))
}

#[cfg(windows)]
fn portable_update_helper_args(
    process_id: u32,
    script_path: &Path,
    staged_exe: &Path,
    current_exe: &Path,
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
    ]
}

#[cfg(windows)]
fn spawn_portable_update_helper(
    script_path: &Path,
    staged_exe: &Path,
    current_exe: &Path,
) -> Result<(), String> {
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    Command::new("powershell.exe")
        .args(portable_update_helper_args(
            std::process::id(),
            script_path,
            staged_exe,
            current_exe,
        ))
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|error| format!("Unable to start update helper: {error}"))?;

    Ok(())
}

#[cfg(windows)]
#[tauri::command]
async fn install_portable_update(app: AppHandle) -> Result<PortableUpdateResult, String> {
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
    let bytes = update
        .download(|_, _| {}, || {})
        .await
        .map_err(|error| format!("Unable to download update: {error}"))?;

    let current_exe =
        std::env::current_exe().map_err(|error| format!("Unable to locate app exe: {error}"))?;
    let (staged_exe, script_path) = stage_portable_update(&bytes, &version)?;
    spawn_portable_update_helper(&script_path, &staged_exe, &current_exe)?;

    app.cleanup_before_exit();
    std::process::exit(0);
}

#[cfg(not(windows))]
#[tauri::command]
async fn install_portable_update(_app: AppHandle) -> Result<PortableUpdateResult, String> {
    Err("Portable updates are only available on Windows.".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_autostart::Builder::new().build());

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_process::init());

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            show_window(&window);
        }
    }));

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![install_portable_update])
        .setup(|app| {
            // Build initial tray menu with default Chinese labels.
            // The frontend will emit "locale-changed" once it loads the saved locale.
            let menu = build_tray_menu(app.handle(), false)?;

            let icon = app
                .default_window_icon()
                .cloned()
                .expect("window icon should be available");

            let tray = TrayIconBuilder::with_id("pay-dance-tray")
                .icon(icon)
                .tooltip(tray_tooltip(false))
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    else {
                        return;
                    };

                    if let Some(window) = tray.app_handle().get_webview_window("main") {
                        show_window(&window);
                    }
                })
                .on_menu_event(|app, event| {
                    let Some(window) = app.get_webview_window("main") else {
                        return;
                    };

                    match event.id().as_ref() {
                        "show" => show_window(&window),
                        "settings" => {
                            show_window(&window);
                            let _ = window.emit(TRAY_OPEN_SETTINGS_EVENT, ());
                        }
                        "toggle_mini" => {
                            show_window(&window);
                            let _ = window.emit(TRAY_TOGGLE_MINI_MODE_EVENT, ());
                        }
                        "toggle_top" => {
                            show_window(&window);
                            let _ = window.emit(TRAY_TOGGLE_ALWAYS_ON_TOP_EVENT, ());
                        }
                        "quit" => {
                            let _ = window.hide();
                            let _ = window.emit("before-app-exit", ());
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            app.manage(TrayState {
                handle: Mutex::new(Some(tray)),
            });

            // Listen for locale-change events from the frontend and rebuild the
            // tray menu + tooltip accordingly.
            let handle = app.handle().clone();
            if let Some(window) = app.get_webview_window("main") {
                let _id = window.listen("locale-changed", move |event| {
                    let use_en = event.payload().contains("en");
                    if let Ok(guard) = handle.state::<TrayState>().handle.lock() {
                        if let Some(tray) = guard.as_ref() {
                            if let Ok(menu) = build_tray_menu(&handle, use_en) {
                                let _ = tray.set_menu(Some(menu));
                                let _ = tray.set_tooltip(Some(tray_tooltip(use_en)));
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(all(test, windows))]
mod tests {
    use super::*;
    use std::ffi::OsString;

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
            Path::new(r"C:\Temp Folder\pay dance.exe"),
            Path::new(r"C:\Program Files\PayDance\pay-dance.exe"),
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
                OsString::from(r"C:\Temp Folder\pay dance.exe"),
                OsString::from("-Destination"),
                OsString::from(r"C:\Program Files\PayDance\pay-dance.exe"),
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
}
