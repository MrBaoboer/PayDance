// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

use std::{sync::Mutex, time::Duration};
use tauri::{
    App, AppHandle, Emitter, Listener, Manager, WebviewWindow, Window, WindowEvent,
    menu::{CheckMenuItemBuilder, MenuBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

const TRAY_OPEN_SETTINGS_EVENT: &str = "tray-open-settings";
const TRAY_TOGGLE_ALWAYS_ON_TOP_EVENT: &str = "tray-toggle-always-on-top";
const TRAY_TOGGLE_MINI_MODE_EVENT: &str = "tray-toggle-mini-mode";
const TRAY_STATE_CHANGED_EVENT: &str = "tray-state-changed";
const WINDOW_SHOWN_EVENT: &str = "window-shown";
const QUIT_FALLBACK_TIMEOUT: Duration = Duration::from_millis(2_500);

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
struct TrayMenuState {
    use_en: bool,
    is_mini_mode: bool,
    always_on_top: bool,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct TrayStatePayload {
    is_mini_mode: Option<bool>,
    always_on_top: Option<bool>,
}

struct TrayState {
    handle: Mutex<Option<tauri::tray::TrayIcon>>,
    menu_state: Mutex<TrayMenuState>,
}

#[derive(Debug, PartialEq, Eq)]
enum TrayAction {
    Show,
    OpenSettings,
    ToggleMiniMode,
    ToggleAlwaysOnTop,
    Quit,
}

struct TrayMenuLabels {
    show: &'static str,
    settings: &'static str,
    toggle_mini: &'static str,
    toggle_top: &'static str,
    quit: &'static str,
}

fn tray_action_for_menu_id(id: &str) -> Option<TrayAction> {
    match id {
        "show" => Some(TrayAction::Show),
        "settings" => Some(TrayAction::OpenSettings),
        "toggle_mini" => Some(TrayAction::ToggleMiniMode),
        "toggle_top" => Some(TrayAction::ToggleAlwaysOnTop),
        "quit" => Some(TrayAction::Quit),
        _ => None,
    }
}

fn tray_menu_labels(use_en: bool) -> TrayMenuLabels {
    if use_en {
        TrayMenuLabels {
            show: "Open",
            settings: "Settings",
            toggle_mini: "Mini Mode",
            toggle_top: "Always on Top",
            quit: "Quit",
        }
    } else {
        TrayMenuLabels {
            show: "打开主界面",
            settings: "打开设置",
            toggle_mini: "迷你悬浮模式",
            toggle_top: "窗口置顶",
            quit: "退出",
        }
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
    state: TrayMenuState,
) -> Result<tauri::menu::Menu<tauri::Wry>, tauri::Error> {
    let labels = tray_menu_labels(state.use_en);
    let mini_item = CheckMenuItemBuilder::with_id("toggle_mini", labels.toggle_mini)
        .checked(state.is_mini_mode)
        .build(app)?;
    let top_item = CheckMenuItemBuilder::with_id("toggle_top", labels.toggle_top)
        .checked(state.always_on_top)
        .build(app)?;

    MenuBuilder::new(app)
        .text("show", labels.show)
        .text("settings", labels.settings)
        .separator()
        .item(&mini_item)
        .item(&top_item)
        .separator()
        .text("quit", labels.quit)
        .build()
}

fn apply_tray_menu_state(app: &AppHandle, update: impl FnOnce(&mut TrayMenuState)) {
    let tray_state = app.state::<TrayState>();
    let next_state = {
        let Ok(mut state_guard) = tray_state.menu_state.lock() else {
            return;
        };
        update(&mut state_guard);
        *state_guard
    };

    if let Ok(handle_guard) = tray_state.handle.lock()
        && let Some(tray) = handle_guard.as_ref()
        && let Ok(menu) = build_tray_menu(app, next_state)
    {
        let _ = tray.set_menu(Some(menu));
        let _ = tray.set_tooltip(Some(tray_tooltip(next_state.use_en)));
    }
}

fn hide_mini_opacity_window(app: &AppHandle) {
    if let Some(opacity_window) = app.get_webview_window("mini-opacity") {
        let _ = opacity_window.hide();
    }
}

// The frontend normally flushes debounced settings and calls plugin-process::exit(0) within a
// few milliseconds. If the webview froze or was not ready yet when Quit was clicked, this
// fallback guarantees the process still exits instead of staying stranded behind a hidden window.
fn schedule_quit_fallback(app: AppHandle) {
    std::thread::spawn(move || {
        std::thread::sleep(QUIT_FALLBACK_TIMEOUT);
        app.exit(0);
    });
}

// Every tray action, the tray click handler and the single-instance callback resolve the
// "main" window and give up when it is gone. The hidden `mini-opacity` companion window is
// created at startup and never destroyed, so tao never sees an empty window list and never
// exits either: destroying the main window used to leave a live process behind a tray icon
// where all five menu entries silently did nothing, recoverable only via Task Manager.
// The frontend hides instead of closing, so a real destroy only happens when the user asked
// the OS to close the window before the frontend could intercept it — and then quitting is
// exactly what they asked for.
pub(crate) fn exit_when_main_window_destroyed(window: &Window, event: &WindowEvent) {
    if window.label() != "main" {
        return;
    }

    if matches!(event, WindowEvent::Destroyed) {
        window.app_handle().exit(0);
    }
}

pub(crate) fn show_window(window: &WebviewWindow) {
    // Windows parks a minimized window at (-32000, -32000) and `show()` maps to SW_SHOW, which
    // leaves it minimized. Every recovery path (tray menu, tray click, second launch) funnels
    // through here, so unminimize first or none of them can bring the window back.
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    // Let the frontend re-check that the window really landed somewhere reachable.
    let _ = window.emit(WINDOW_SHOWN_EVENT, ());
}

fn dispatch_tray_action(window: &WebviewWindow, action: TrayAction) {
    match action {
        TrayAction::Show => show_window(window),
        TrayAction::OpenSettings => {
            show_window(window);
            let _ = window.emit(TRAY_OPEN_SETTINGS_EVENT, ());
        }
        TrayAction::ToggleMiniMode => {
            show_window(window);
            let _ = window.emit(TRAY_TOGGLE_MINI_MODE_EVENT, ());
        }
        TrayAction::ToggleAlwaysOnTop => {
            show_window(window);
            let _ = window.emit(TRAY_TOGGLE_ALWAYS_ON_TOP_EVENT, ());
        }
        TrayAction::Quit => {
            hide_mini_opacity_window(window.app_handle());
            let _ = window.hide();
            let _ = window.emit("before-app-exit", ());
            schedule_quit_fallback(window.app_handle().clone());
        }
    }
}

pub(crate) fn setup(app: &mut App) -> Result<(), tauri::Error> {
    let initial_state = TrayMenuState::default();
    let menu = build_tray_menu(app.handle(), initial_state)?;
    let icon = app
        .default_window_icon()
        .cloned()
        .expect("window icon should be available");

    let tray = TrayIconBuilder::with_id("pay-dance-tray")
        .icon(icon)
        .tooltip(tray_tooltip(initial_state.use_en))
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
            let Some(action) = tray_action_for_menu_id(event.id().as_ref()) else {
                return;
            };
            let Some(window) = app.get_webview_window("main") else {
                return;
            };

            dispatch_tray_action(&window, action);
        })
        .build(app)?;

    app.manage(TrayState {
        handle: Mutex::new(Some(tray)),
        menu_state: Mutex::new(initial_state),
    });

    let locale_handle = app.handle().clone();
    let state_handle = app.handle().clone();
    if let Some(window) = app.get_webview_window("main") {
        let _locale_id = window.listen("locale-changed", move |event| {
            // The payload is a JSON-encoded locale string. A substring match would start
            // misfiring the moment a locale like "en-GB" or "sv" is added.
            let use_en = serde_json::from_str::<String>(event.payload())
                .map(|locale| locale == "en")
                .unwrap_or(false);
            apply_tray_menu_state(&locale_handle, |state| {
                state.use_en = use_en;
            });
        });

        let _state_id = window.listen(TRAY_STATE_CHANGED_EVENT, move |event| {
            let Ok(payload) = serde_json::from_str::<TrayStatePayload>(event.payload()) else {
                return;
            };
            apply_tray_menu_state(&state_handle, |state| {
                if let Some(is_mini_mode) = payload.is_mini_mode {
                    state.is_mini_mode = is_mini_mode;
                }
                if let Some(always_on_top) = payload.always_on_top {
                    state.always_on_top = always_on_top;
                }
            });
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_known_menu_ids_to_domain_actions() {
        assert_eq!(tray_action_for_menu_id("show"), Some(TrayAction::Show));
        assert_eq!(
            tray_action_for_menu_id("settings"),
            Some(TrayAction::OpenSettings)
        );
        assert_eq!(
            tray_action_for_menu_id("toggle_mini"),
            Some(TrayAction::ToggleMiniMode)
        );
        assert_eq!(
            tray_action_for_menu_id("toggle_top"),
            Some(TrayAction::ToggleAlwaysOnTop)
        );
        assert_eq!(tray_action_for_menu_id("quit"), Some(TrayAction::Quit));
        assert_eq!(tray_action_for_menu_id("unknown"), None);
    }

    #[test]
    fn localizes_menu_labels_and_tooltips() {
        assert_eq!(tray_menu_labels(false).show, "打开主界面");
        assert_eq!(tray_menu_labels(false).toggle_mini, "迷你悬浮模式");
        assert_eq!(tray_menu_labels(false).toggle_top, "窗口置顶");
        assert_eq!(tray_menu_labels(true).show, "Open");
        assert_eq!(tray_menu_labels(true).toggle_mini, "Mini Mode");
        assert_eq!(tray_menu_labels(true).toggle_top, "Always on Top");
        assert_eq!(tray_tooltip(false), "薪跳 · 桌面实时工资看板");
        assert_eq!(
            tray_tooltip(true),
            "PayDance · Desktop Real-Time Salary Dashboard"
        );
    }
}
