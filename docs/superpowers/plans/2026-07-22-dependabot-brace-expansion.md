# Dependabot brace-expansion 安全修复实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 清除 PayDance 的 `GHSA-3jxr-9vmj-r5cp` Dependabot 高危警报，并确保开发依赖与间接依赖以后进入本地和 CI 的安全审计门禁。

**架构：** 先用 `npm audit --audit-level=high` 作为可复现的失败用例，再只更新锁文件中受影响的 `brace-expansion` 实例。Dependabot updater 对本次多版本间接依赖连续返回 `update_not_possible`；同时 npm 的 `allow: dependency-type: "all"` 只允许清单中的显式依赖，反而会缩小默认安全更新范围。因此可靠防线是手工最小锁文件更新，并把全依赖高危审计接入发布脚本和 CI。

**技术栈：** npm 11、Vitest、GitHub Actions、Dependabot、Vue 3、Tauri/Rust

---

### 任务 1：锁定安全治理契约

**文件：**
- 修改：`scripts/verify-scripts.test.js`
- 修改：`scripts/ci-workflow.test.js`

- [ ] **步骤 1：编写失败的测试**

在 `scripts/verify-scripts.test.js` 中要求发布校验包含全部 npm 依赖的高危审计：

```js
const releaseCommands = packageJson.scripts["verify:release"]
  .split("&&")
  .map((command) => command.trim());

expect(releaseCommands).toContain("npm audit --audit-level=high");
expect(releaseCommands).not.toContain("npm audit --omit=dev");
expect(packageJson.scripts["verify:release"]).not.toMatch(
  /\bnpm audit\b[^&]*(?:--omit(?:=|\s+)dev)\b/,
);
```

在 `scripts/ci-workflow.test.js` 中要求 CI 使用相同门禁：

```js
expect(ciWorkflow).toMatch(
  /- name: Audit all npm dependencies\r?\n\s+run: npm audit --audit-level=high(?:\r?\n|$)/,
);
expect(ciWorkflow).not.toMatch(
  /\bnpm audit\b[^\r\n]*(?:--omit(?:=|\s+)dev)\b/,
);
expect(ciWorkflow).not.toMatch(/\bNPM_CONFIG_OMIT:\s*dev\b/);
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```powershell
npx vitest run scripts/verify-scripts.test.js scripts/ci-workflow.test.js
```

预期：FAIL；失败点应是旧发布脚本和 CI 仍使用 `npm audit --omit=dev`。

- [ ] **步骤 3：保持测试改动最小**

确认没有改动业务源码，也没有放宽已有断言；新断言只描述本次安全门禁。

- [ ] **步骤 4：再次运行目标测试确认仍为预期失败**

运行：

```powershell
npx vitest run scripts/verify-scripts.test.js scripts/ci-workflow.test.js
```

预期：FAIL，且原因与步骤 2 一致。

- [ ] **步骤 5：Commit**

目标测试与实现紧密耦合，本任务完成后与任务 2 一起提交，避免提交一个必然失败的中间状态。

### 任务 2：修复锁文件并补齐自动化门禁

**文件：**
- 修改：`package-lock.json`
- 修改：`package.json`
- 修改：`.github/workflows/ci.yml`
- 修改：`.github/PULL_REQUEST_TEMPLATE.md`
- 测试：`scripts/verify-scripts.test.js`
- 测试：`scripts/ci-workflow.test.js`

- [ ] **步骤 1：更新受影响的间接依赖**

运行：

```powershell
npm audit fix --package-lock-only
```

预期：`brace-expansion` 的两个 2.x 实例更新到 `2.1.2`，5.x 实例更新到 `5.0.7`，其他直接依赖声明不变。

- [ ] **步骤 2：配置发布与 CI 高危门禁**

将 `package.json` 的发布审计片段改为：

```json
"npm audit --audit-level=high"
```

将 `.github/workflows/ci.yml` 的审计步骤改为：

```yaml
- name: Audit all npm dependencies
  run: npm audit --audit-level=high
```

并将 `.github/PULL_REQUEST_TEMPLATE.md` 的对应人工检查项同步为 `npm audit --audit-level=high`。

- [ ] **步骤 3：运行目标测试验证通过**

运行：

```powershell
npx vitest run scripts/verify-scripts.test.js scripts/ci-workflow.test.js
```

预期：PASS。

- [ ] **步骤 4：验证漏洞已消失**

运行：

```powershell
npm audit --audit-level=high
npm ls brace-expansion --all
```

预期：`found 0 vulnerabilities`；依赖树只包含 `brace-expansion@2.1.2` 和 `brace-expansion@5.0.7`。

- [ ] **步骤 5：Commit**

```powershell
git add package-lock.json package.json .github/workflows/ci.yml .github/PULL_REQUEST_TEMPLATE.md scripts/verify-scripts.test.js scripts/ci-workflow.test.js docs/superpowers/plans/2026-07-22-dependabot-brace-expansion.md
git commit -m "fix(security): resolve brace-expansion advisory"
```

### 任务 3：完整验证与发布

**文件：**
- 验证：全部已修改文件和现有前端、Rust 项目

- [ ] **步骤 1：运行前端快速验证**

运行：

```powershell
npm run verify:fast
```

预期：lint、格式、351 个现有测试及桌面/Web 构建全部通过。

- [ ] **步骤 2：运行元数据验证**

运行：

```powershell
npm run verify:metadata
```

预期：安全治理契约、CI 范围和仓库元数据测试全部通过，`git diff --check` 无错误。

- [ ] **步骤 3：运行 Rust 验证**

运行：

```powershell
Push-Location src-tauri
cargo fmt --all -- --check
cargo check
cargo clippy --all-targets -- -D warnings
cargo test
Pop-Location
```

预期：全部通过，0 条警告。

- [ ] **步骤 4：推送分支并创建 PR**

```powershell
git push -u origin codex/fix-dependabot-brace-expansion
gh pr create --base main --head codex/fix-dependabot-brace-expansion --title "fix(security): resolve brace-expansion advisory"
```

预期：PR 创建成功，`CI gate` 与 `CodeQL gate` 启动。

- [ ] **步骤 5：等待必需检查并合并**

运行：

```powershell
gh pr checks --watch --fail-fast
gh pr merge --squash --delete-branch
```

预期：必需检查通过，PR 合并到 `main`。

- [ ] **步骤 6：确认警报关闭**

运行：

```powershell
gh api repos/MrBaoboer/PayDance/dependabot/alerts/2 --jq '.state'
gh api "repos/MrBaoboer/PayDance/dependabot/alerts?state=open"
```

预期：第一条命令输出 `fixed`，直接确认警报 #2 已修复；第二条命令独立返回空数组，确认没有其他开放警报；默认分支 `npm audit --audit-level=high` 为 0 个漏洞。
