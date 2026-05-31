use std::sync::Mutex;
use tauri::{
    menu::MenuBuilder,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Listener, Manager, WebviewWindow,
};

const TRAY_OPEN_SETTINGS_EVENT: &str = "tray-open-settings";
const TRAY_TOGGLE_ALWAYS_ON_TOP_EVENT: &str = "tray-toggle-always-on-top";
const TRAY_TOGGLE_MINI_MODE_EVENT: &str = "tray-toggle-mini-mode";

struct TrayState {
    handle: Mutex<Option<tauri::tray::TrayIcon>>,
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
                            // Emit event so the frontend can flush state before exit.
                            let _ = app.emit("before-app-exit", ());
                            let handle = app.clone();
                            std::thread::spawn(move || {
                                std::thread::sleep(std::time::Duration::from_secs(3));
                                handle.exit(0);
                            });
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
