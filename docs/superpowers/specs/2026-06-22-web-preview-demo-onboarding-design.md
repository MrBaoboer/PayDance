# Web Preview 演示模式与可重开首次向导设计

## 目标

让 PayDance 官网更适合作品集和面试展示：访客首次打开官网时直接看到正在运行的完整看板，不被首次启动向导遮挡；演示配置使用现有默认薪资与偏好，仅将工作日设为星期一至星期日。设置入口继续完整可用，并提供“首次启动向导”操作，方便主动展示产品的配置流程。

## 产品边界

- 仅修改 Web Preview，不改变 Windows 桌面版的首次启动行为和默认配置。
- 首次访问浏览器且没有已保存薪资配置时，写入一份 Web Preview 专用演示配置。
- 演示配置继承 `defaultSalaryConfig`，只把 `workdays` 改为 `[0, 1, 2, 3, 4, 5, 6]`。
- 首次访问同时把 Web Preview 的 onboarding 状态标记为已完成，因此直接显示看板。
- 已经修改并保存过设置的访客继续使用自己的配置，不被演示配置覆盖。
- 设置页增加 Web Preview 专属“首次启动向导”按钮。点击后关闭设置并打开现有三步向导。
- 向导使用当前配置作为起点；完成后保存修改并回到完整看板。
- 不增加重置按钮、不改变桌面端设置页、不复制一套新的向导 UI。

## 架构

新增 `src/web-preview/demo-config.ts`，集中负责：

1. 创建独立的七天演示配置，避免修改共享默认对象。
2. 检查浏览器设置存储中是否已有薪资配置。
3. 仅在配置不存在时写入演示配置和“已完成首次向导”状态。

`useWebPreviewState.ts` 在加载设置前调用演示配置初始化，并维护一个仅属于 Web Preview 的 `isOnboardingOpen` 状态。它包装现有 `completeOnboarding`，使重开的向导能够正常关闭并保存。

共享组件通过可选能力扩展：

- `SettingsPanel` 增加 `showOnboardingAction` 属性与 `openOnboarding` 事件。
- `AppWindow` 负责把可选属性和事件透传。
- `WebPreviewShowcase` 开启该能力并连接 Web Preview 状态。
- 默认值均为关闭，因此桌面端无行为变化。

## 文案与布局

新增双语键：

- `settings.onboarding`：`首次启动向导` / `First-time setup`
- `settings.openOnboarding`：`打开首次启动向导` / `Open first-time setup`

入口位于设置内容底部、About Footer 之前，以一个独立轻量设置组呈现。按钮沿用现有设置页尺寸、边框、圆角、字体和交互反馈，不引入新的视觉语言。

## 测试

- 单元测试确认演示配置包含七天，且不会修改 `defaultSalaryConfig`。
- 单元测试确认仅在没有保存配置时写入演示配置。
- 单元测试确认已有配置不会被覆盖。
- 组件测试确认 Web Preview 开关打开时显示按钮，点击后发出事件；桌面默认状态不显示。
- Web Preview 结构测试确认初始化、事件透传和专属入口均已连接。
- 运行 `npm run verify:fast` 和 `npm run qa:web-preview`。

## 验收标准

1. 清空浏览器设置后打开官网，直接看到完整看板。
2. 任意星期打开官网都能显示工作日状态，默认工作日为周一至周日。
3. 修改设置并刷新后，修改结果仍保留。
4. 设置页可以打开现有首次启动向导。
5. 完成向导后回到完整看板，修改得到保存。
6. Windows 桌面版仍在首次运行时自动显示向导，默认工作日仍为周一至周五。

