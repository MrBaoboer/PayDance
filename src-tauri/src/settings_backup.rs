// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

use std::{
    fs,
    path::{Component, Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

// The frontend only ever names the file; the directory is always the app data dir.
fn is_plain_file_name(file_name: &str) -> bool {
    if file_name.is_empty()
        || file_name == "."
        || file_name == ".."
        || file_name.contains(['/', '\\', ':'])
    {
        return false;
    }

    let mut components = Path::new(file_name).components();
    matches!(components.next(), Some(Component::Normal(_))) && components.next().is_none()
}

fn backup_path_for(path: &Path, timestamp_secs: u64, suffix: Option<u32>) -> PathBuf {
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("settings");
    match suffix {
        Some(index) => path.with_file_name(format!("{file_name}.bak-{timestamp_secs}-{index}")),
        None => path.with_file_name(format!("{file_name}.bak-{timestamp_secs}")),
    }
}

fn resolve_unique_backup_path(path: &Path, timestamp_secs: u64) -> Result<PathBuf, String> {
    let primary = backup_path_for(path, timestamp_secs, None);
    if !primary.exists() {
        return Ok(primary);
    }

    for index in 1..=100 {
        let candidate = backup_path_for(path, timestamp_secs, Some(index));
        if !candidate.exists() {
            return Ok(candidate);
        }
    }

    Err("Unable to find an unused backup file name.".to_string())
}

// Moves an unreadable settings file aside so the store can be rebuilt without losing the
// original. Returns the backup path, or None when there was no file to move.
#[tauri::command]
pub(crate) fn backup_unreadable_settings(
    app: AppHandle,
    file_name: String,
) -> Result<Option<String>, String> {
    if !is_plain_file_name(&file_name) {
        return Err("Invalid settings file name.".to_string());
    }

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Unable to locate app data directory: {error}"))?;
    let settings_path = data_dir.join(&file_name);
    if !settings_path.exists() {
        return Ok(None);
    }

    let timestamp_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_secs())
        .unwrap_or(0);
    let backup_path = resolve_unique_backup_path(&settings_path, timestamp_secs)?;
    fs::rename(&settings_path, &backup_path)
        .map_err(|error| format!("Unable to back up settings: {error}"))?;

    Ok(Some(backup_path.to_string_lossy().into_owned()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_bare_file_names() {
        assert!(is_plain_file_name("salary-settings.json"));
        assert!(!is_plain_file_name(""));
        assert!(!is_plain_file_name("."));
        assert!(!is_plain_file_name(".."));
        assert!(!is_plain_file_name("../salary-settings.json"));
        assert!(!is_plain_file_name("nested\\salary-settings.json"));
        assert!(!is_plain_file_name("C:salary-settings.json"));
    }

    #[test]
    fn names_the_backup_next_to_the_original() {
        let backup = backup_path_for(
            Path::new("C:\\data\\salary-settings.json"),
            1_700_000_000,
            None,
        );

        assert_eq!(
            backup,
            PathBuf::from("C:\\data\\salary-settings.json.bak-1700000000")
        );
    }

    #[test]
    fn appends_a_collision_suffix_when_same_second_backup_exists() {
        let test_dir =
            std::env::temp_dir().join(format!("paydance-backup-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&test_dir);
        fs::create_dir_all(&test_dir).expect("test directory should be created");

        let original = test_dir.join("salary-settings.json");
        let existing_backup = backup_path_for(&original, 1_700_000_000, None);
        fs::write(&existing_backup, b"first").expect("existing backup should be created");

        let next_backup = resolve_unique_backup_path(&original, 1_700_000_000)
            .expect("unique backup path should resolve");
        assert_eq!(
            next_backup,
            test_dir.join("salary-settings.json.bak-1700000000-1")
        );

        fs::remove_dir_all(&test_dir).expect("test directory should be cleaned up");
    }
}
