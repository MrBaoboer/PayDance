// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

use std::{cell::RefCell, mem::size_of, ptr::null_mut, slice};
use windows::{
    Win32::{
        Foundation::{COLORREF, HWND, LPARAM, LRESULT, POINT, RECT, SIZE, WPARAM},
        Graphics::Gdi::{
            AC_SRC_ALPHA, AC_SRC_OVER, BI_RGB, BITMAPINFO, BITMAPINFOHEADER, BLENDFUNCTION,
            ClientToScreen, CreateCompatibleDC, CreateDIBSection, DIB_RGB_COLORS, DeleteDC,
            DeleteObject, HGDIOBJ, SelectObject,
        },
        UI::{
            HiDpi::GetDpiForWindow,
            Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass},
            WindowsAndMessaging::{
                CreateWindowExW, DestroyWindow, GW_HWNDNEXT, GWL_EXSTYLE, GetClientRect, GetWindow,
                GetWindowLongW, HWND_NOTOPMOST, HWND_TOPMOST, IsIconic, IsWindowVisible, SW_HIDE,
                SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOOWNERZORDER, SWP_NOSIZE, SWP_NOZORDER,
                SWP_SHOWWINDOW, SetWindowPos, ShowWindow, ULW_ALPHA, UpdateLayeredWindow,
                WM_ACTIVATE, WM_DPICHANGED, WM_NCDESTROY, WM_SHOWWINDOW, WM_WINDOWPOSCHANGED,
                WS_EX_LAYERED, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW, WS_EX_TOPMOST,
                WS_EX_TRANSPARENT, WS_POPUP,
            },
        },
    },
    core::{Error, PCWSTR, Result, w},
};

thread_local! {
    // The synchronous Tauri command and the subclass run on the window thread.
    static SHADOW: RefCell<Option<Shadow>> = const { RefCell::new(None) };
}

const SUBCLASS_ID: usize = 1;
const SHADOW_MARGIN: f32 = 15.0;

pub(super) fn set(main: HWND, enabled: bool, mini: bool) -> Result<()> {
    SHADOW.with_borrow_mut(|slot| {
        if !enabled {
            if slot.is_some() {
                unsafe { RemoveWindowSubclass(main, Some(window_proc), SUBCLASS_ID).ok()? };
                slot.take();
            }
            return Ok(());
        }

        if let Some(shadow) = slot {
            shadow.mini = mini;
            return shadow.sync(main);
        }

        let mut shadow = Shadow::new(mini)?;
        shadow.sync(main)?;
        unsafe { SetWindowSubclass(main, Some(window_proc), SUBCLASS_ID, 0).ok()? };
        *slot = Some(shadow);
        Ok(())
    })
}

unsafe extern "system" fn window_proc(
    main: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _: usize,
    _: usize,
) -> LRESULT {
    if message == WM_NCDESTROY {
        let _ = unsafe { RemoveWindowSubclass(main, Some(window_proc), SUBCLASS_ID) };
        SHADOW.with_borrow_mut(|slot| slot.take());
    }

    let result = unsafe { DefSubclassProc(main, message, wparam, lparam) };
    if matches!(
        message,
        WM_WINDOWPOSCHANGED | WM_SHOWWINDOW | WM_ACTIVATE | WM_DPICHANGED
    ) {
        SHADOW.with(|slot| {
            if let Ok(mut slot) = slot.try_borrow_mut()
                && let Some(shadow) = slot.as_mut()
                && shadow.sync(main).is_err()
            {
                let _ = unsafe { ShowWindow(shadow.hwnd, SW_HIDE) };
            }
        });
    }
    result
}

struct Shadow {
    hwnd: HWND,
    mini: bool,
    rendered: Option<(i32, i32, u32, bool)>,
}

impl Shadow {
    fn new(mini: bool) -> Result<Self> {
        let hwnd = unsafe {
            CreateWindowExW(
                WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
                w!("STATIC"),
                PCWSTR::null(),
                WS_POPUP,
                0,
                0,
                0,
                0,
                None,
                None,
                None,
                None,
            )?
        };
        Ok(Self {
            hwnd,
            mini,
            rendered: None,
        })
    }

    fn sync(&mut self, main: HWND) -> Result<()> {
        // A pop-up with no owner can be positioned *below* the main window. Match the
        // topmost group first so the shadow follows the widget when it changes mode.
        unsafe {
            if !IsWindowVisible(main).as_bool() || IsIconic(main).as_bool() {
                let _ = ShowWindow(self.hwnd, SW_HIDE);
                return Ok(());
            }

            let mut rect = RECT::default();
            let mut origin = POINT::default();
            GetClientRect(main, &mut rect)?;
            ClientToScreen(main, &mut origin).ok()?;
            if rect.right == 0 || rect.bottom == 0 {
                let _ = ShowWindow(self.hwnd, SW_HIDE);
                return Ok(());
            }

            let dpi = GetDpiForWindow(main);
            let scale = dpi as f32 / 96.0;
            let margin = (SHADOW_MARGIN * scale).ceil() as i32;
            let x = origin.x - margin;
            let y = origin.y - margin;
            let key = (rect.right, rect.bottom, dpi, self.mini);
            if self.rendered != Some(key) {
                self.draw(rect, scale, margin)?;
                self.rendered = Some(key);
            }

            let topmost =
                |window| GetWindowLongW(window, GWL_EXSTYLE) as u32 & WS_EX_TOPMOST.0 != 0;
            let flags = SWP_NOSIZE | SWP_NOACTIVATE | SWP_NOOWNERZORDER;
            if topmost(self.hwnd) != topmost(main) {
                let order = if topmost(main) {
                    HWND_TOPMOST
                } else {
                    HWND_NOTOPMOST
                };
                SetWindowPos(self.hwnd, Some(order), 0, 0, 0, 0, flags | SWP_NOMOVE)?;
            }
            let order = if GetWindow(main, GW_HWNDNEXT).ok() == Some(self.hwnd) {
                SWP_NOZORDER
            } else {
                Default::default()
            };
            SetWindowPos(
                self.hwnd,
                Some(main),
                x,
                y,
                0,
                0,
                flags | order | SWP_SHOWWINDOW,
            )
        }
    }

    fn draw(&self, rect: RECT, scale: f32, margin: i32) -> Result<()> {
        let size = SIZE {
            cx: rect.right + margin * 2,
            cy: rect.bottom + margin * 2,
        };
        let info = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: size.cx,
                biHeight: -size.cy,
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };
        let blend = BLENDFUNCTION {
            BlendOp: AC_SRC_OVER as u8,
            SourceConstantAlpha: 255,
            AlphaFormat: AC_SRC_ALPHA as u8,
            ..Default::default()
        };
        unsafe {
            let mut bits = null_mut();
            let bitmap = CreateDIBSection(None, &info, DIB_RGB_COLORS, &mut bits, None, 0)?;
            let bitmap = HGDIOBJ(bitmap.0);
            let dc = CreateCompatibleDC(None);
            if dc.is_invalid() {
                let error = Error::from_thread();
                let _ = DeleteObject(bitmap);
                return Err(error);
            }
            let previous = SelectObject(dc, bitmap);
            if previous.is_invalid() {
                let error = Error::from_thread();
                let _ = DeleteDC(dc);
                let _ = DeleteObject(bitmap);
                return Err(error);
            }
            let pixels = slice::from_raw_parts_mut(
                bits.cast::<u32>(),
                (size.cx as usize) * (size.cy as usize),
            );
            let shape = ShadowShape::new(rect.right, rect.bottom, scale, self.mini);
            for (y, row) in pixels.chunks_exact_mut(size.cx as usize).enumerate() {
                for (x, pixel) in row.iter_mut().enumerate() {
                    let x = (x as f32 + 0.5 - margin as f32) / scale;
                    let y = (y as f32 + 0.5 - margin as f32) / scale;
                    *pixel = shape.pixel(x, y, scale);
                }
            }
            let result = UpdateLayeredWindow(
                self.hwnd,
                None,
                None,
                Some(&size),
                Some(dc),
                Some(&POINT::default()),
                COLORREF(0),
                Some(&blend),
                ULW_ALPHA,
            );
            SelectObject(dc, previous);
            let _ = DeleteDC(dc);
            let _ = DeleteObject(bitmap);
            result
        }
    }
}

impl Drop for Shadow {
    fn drop(&mut self) {
        let _ = unsafe { DestroyWindow(self.hwnd) };
    }
}

struct ShadowShape {
    half_width: f32,
    half_height: f32,
    radius: f32,
    inset: f32,
}

impl ShadowShape {
    fn new(width: i32, height: i32, scale: f32, mini: bool) -> Self {
        // Match the visible card, including the mini shell's existing four-pixel padding.
        let (radius, inset) = if mini { (14.0, 4.0) } else { (22.0, 0.0) };
        Self {
            half_width: width as f32 / (scale * 2.0),
            half_height: height as f32 / (scale * 2.0),
            radius,
            inset,
        }
    }

    fn distance(&self, x: f32, y: f32) -> f32 {
        let dx = (x - self.half_width).abs() - (self.half_width - self.inset - self.radius);
        let dy = (y - self.half_height).abs() - (self.half_height - self.inset - self.radius);
        let outside_x = dx.max(0.0);
        let outside_y = dy.max(0.0);
        (outside_x * outside_x + outside_y * outside_y).sqrt() + dx.max(dy).min(0.0) - self.radius
    }

    fn pixel(&self, x: f32, y: f32, scale: f32) -> u32 {
        let distance = self.distance(x, y);
        let coverage = (distance * scale + 0.5).clamp(0.0, 1.0);
        if coverage == 0.0 {
            return 0;
        }

        // Approximate the original CSS shadows: 0 2px 9px -1px at 24% and
        // 0 0 2px at 16%. Mask the card interior for transparent mini cards.
        let soft = 0.24 * blur_edge((self.distance(x, y - 2.0) + 1.0) / 4.5);
        let contact = 0.16 * blur_edge(distance);
        let alpha = ((soft + contact * (1.0 - soft)) * coverage * 255.0).round() as u32;
        // The layered window uses premultiplied BGRA (RGB 15, 23, 42).
        (alpha << 24) | ((15 * alpha / 255) << 16) | ((23 * alpha / 255) << 8) | (42 * alpha / 255)
    }
}

fn blur_edge(distance: f32) -> f32 {
    // Tail probabilities of a standard normal distribution at half-sigma intervals.
    const SAMPLES: [f32; 13] = [
        1.0, 0.994, 0.977, 0.933, 0.841, 0.691, 0.5, 0.309, 0.159, 0.067, 0.023, 0.006, 0.0,
    ];
    let index = (distance * 2.0 + 6.0).clamp(0.0, 12.0);
    let lower = (index as usize).min(11);
    let fraction = index - lower as f32;
    SAMPLES[lower] + (SAMPLES[lower + 1] - SAMPLES[lower]) * fraction
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paints_a_soft_shadow_outside_the_rounded_card() {
        for (width, height, mini) in [(480, 460, false), (176, 54, true)] {
            let shape = ShadowShape::new(width, height, 1.0, mini);
            let middle = width as f32 / 2.0;
            let edge = height as f32 - shape.inset;
            let alpha = |y| shape.pixel(middle, y, 1.0) >> 24;
            assert_eq!(alpha(edge - 1.0), 0);
            assert!((10..=45).contains(&alpha(edge + 2.0)));
            assert!(alpha(edge + 7.0) < alpha(edge + 2.0));
            assert_eq!(alpha(edge + 16.0), 0);
            assert!(shape.pixel(shape.inset + 2.0, shape.inset + 2.0, 1.0) > 0);
        }
    }
}
