use tauri::{menu::MenuBuilder, tray::TrayIconBuilder, Emitter, Manager, WebviewWindow};

fn show_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_autostart::Builder::new().build());

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let menu = MenuBuilder::new(app)
                .text("show", "打开窗口")
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
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    let Some(window) = app.get_webview_window("main") else {
                        return;
                    };

                    match event.id().as_ref() {
                        "show" => show_window(&window),
                        "settings" => {
                            show_window(&window);
                            let _ = window.emit("tray-open-settings", ());
                        }
                        "toggle_mini" => {
                            show_window(&window);
                            let _ = window.emit("tray-toggle-mini-mode", ());
                        }
                        "toggle_top" => {
                            show_window(&window);
                            let _ = window.emit("tray-toggle-always-on-top", ());
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
