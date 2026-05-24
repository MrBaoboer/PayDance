use tauri::{
    menu::MenuBuilder,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WebviewWindow,
};

const TRAY_OPEN_SETTINGS_EVENT: &str = "tray-open-settings";
const TRAY_TOGGLE_ALWAYS_ON_TOP_EVENT: &str = "tray-toggle-always-on-top";
const TRAY_TOGGLE_MINI_MODE_EVENT: &str = "tray-toggle-mini-mode";

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
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            show_window(&window);
        }
    }));

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let menu = MenuBuilder::new(app)
                .text("show", "打开主界面")
                .text("settings", "打开设置")
                .text("toggle_mini", "切换迷你模式")
                .separator()
                .text("toggle_top", "切换置顶")
                .text("quit", "退出")
                .build()?;

            let icon = app
                .default_window_icon()
                .cloned()
                .expect("window icon should be available");

            TrayIconBuilder::with_id("pay-dance-tray")
                .icon(icon)
                .tooltip("薪跳 · 桌面实时薪资仪表盘")
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
                        "quit" => app.exit(0),
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
