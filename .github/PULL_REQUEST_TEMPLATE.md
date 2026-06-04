## 变更内容

- 请用 2-4 条说明这次 PR 改了什么，以及为什么需要这样改。

## 影响范围

- [ ] 桌面端体验
- [ ] Web Preview
- [ ] 平台适配
- [ ] 构建、发布或安全治理
- [ ] 文档、社区或法律材料

## 验证方式

请选择与你的改动相关的检查；不适用的项目请说明原因。

- [ ] `npm run verify:metadata`
- [ ] `npm run verify:fast`
- [ ] `npm audit --omit=dev`
- [ ] `Push-Location src-tauri; cargo fmt --all -- --check; cargo check; cargo clippy --all-targets -- -D warnings; cargo audit --deny warnings; cargo deny check --hide-inclusion-graph; Pop-Location`
- [ ] `npm run qa:web-preview`
- [ ] Windows 桌面端人工冒烟
- [ ] 平台适配人工冒烟与维护边界说明

## 风险与回滚

- 请说明最需要关注的风险，以及如果出现问题应如何回退或缓解。

## 提交确认

- [ ] 没有更新版本号，除非这个 PR 的目标就是发版
- [ ] 没有提交私钥、薪资数据、构建产物或本机缓存
- [ ] 文档链接已检查，中文默认文档与英文镜像保持一致
