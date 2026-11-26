// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

#[cfg(windows)]
mod native;

#[tauri::command]
pub fn set_window_shadow(
    window: tauri::WebviewWindow,
    enabled: bool,
    mini: bool,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Window shadow is only available on the main window".into());
    }

    #[cfg(windows)]
    native::set(
        window.hwnd().map_err(|error| error.to_string())?,
        enabled,
        mini,
    )
    .map_err(|error| error.to_string())?;
    #[cfg(not(windows))]
    let _ = (enabled, mini);

    Ok(())
}
