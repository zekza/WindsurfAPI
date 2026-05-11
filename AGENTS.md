# AGENTS.md

本文件记录本仓库的默认协作约束、当前分支背景和已经完成的 fork 对比结论。后续 Agent 在本仓库工作时，应优先遵循用户最新指令；如果没有新的明确指令，则按本文记录执行。

## 项目用途

- 本仓库当前主要用于接入 sub2api，并通过 Anthropic `/v1/messages` 接口对外提供给 Claude Code 使用。
- 变更优先级应围绕 Claude Code 工具流、会话复用、compact/summary 回合、流式响应、sub2api/Docker 部署兼容性和模型路由。
- 不要为了“看起来更新”而泛合并 fork 改动；必须先判断是否直接服务于上述用途。

## 语言和记录

- 与用户沟通、分析说明、过程记录和仓库内新增说明文档默认使用简体中文。
- 代码标识符、命令、提交哈希、项目名、协议字段和日志原文可保留原语言。
- 文本文件使用 UTF-8 无 BOM。
- 涉及 fork 对比、合并取舍、验证命令的结论，需要写入可追溯文档。

## 当前工作分支和远端

- 用户 fork 远端：`git@github.com:zekza/WindsurfAPI.git`
- 本次集成分支：`integrate-fork-updates-sub2api`
- 已推送到远端分支：`zekza/integrate-fork-updates-sub2api`
- 后续继续基于该分支工作时，先检查 `git status --short --branch`，不要覆盖用户或其他 Agent 的未提交改动。

## fork 对比方法

- fork 列表可用 GitHub CLI 获取：
  - `gh api repos/dwgx/WindsurfAPI/forks --paginate`
- ahead/behind 统计使用本地 git 对比：
  - `git rev-list --left-right --count origin/master...refs/tmp/forks/<owner>_<repo>`
- 只看 ahead 数不可靠。很多 fork 领先提交数高，是因为基于旧上游历史，同时落后当前上游大量提交。
- 合并前必须看具体 diff、提交意图和当前上游是否已有等价实现。
- 详细对比记录见：
  - `docs/fork-review-2026-05-12.md`

## 已合入的 fork 修复

已从 `snakeeeeeeeee/WindsurfAPI` 适配合入以下 Claude CLI compact 相关修复：

- `8590a84 fix: 修复 Claude CLI compact 摘要被误解析为工具调用`
- `6c9d31e fix: 修复 Claude CLI compact 后续请求误判为纯文本模式`

当前分支实现要点：

- `src/handlers/messages.js`
  - 新增 `isAnthropicConversationCompactionRequest()`。
  - 只根据最新 user 消息识别 compact/summary 回合。
  - compact 当轮移除 `tools` / `tool_choice`，并传入 `__forceTextResponse`。
- `src/handlers/chat.js`
  - 支持 `__forceTextResponse`。
  - 保留历史 `tool_use` / `tool_result` 作为上下文。
  - compact 当轮禁止输出 tool-call parsing/native bridge，避免摘要内容被误转成工具调用。
- `test/messages.test.js`
  - 增加 compact 回归测试。
  - 修正 `web_search_20250305` 测试期望，使其匹配当前转换行为。

该修复与用户反馈的 Claude Code “一个任务结束后未等待用户指令就继续执行”高度相关：compact/summary 响应中的 tool-shaped 文本可能被误解析为 `tool_use`，导致 Claude Code 继续执行。

## 暂不建议直接合并的功能

以下功能有潜在价值，但不应在没有专项审计和验证的情况下直接合并：

- 会话复用 / 工具链相关：
  - 来源：`snakeeeeeeeee/WindsurfAPI`
  - 相关提交：`ed55a5c`, `f7fed1b`, `79a1608`, `5e3ba04`
  - 可能改善 Claude Code 连续工具调用、复用 MISS、冷启动无输出重试等问题。
  - 风险：会改变 `conversation-pool` 复用语义；后续若再次出现 Claude Code 连续性异常，应单独审计这组改动。
- 首字延迟 / 可观测性日志：
  - 来源：`snakeeeeeeeee/WindsurfAPI`
  - 相关提交：`c30173f`, `f3f8f14`
  - 价值：排查 Claude Code 卡顿、无输出、慢响应时可能有帮助。
  - 风险：会增加日志噪音；不是功能修复。
- Anthropic 缓存用量统计：
  - 来源：`snakeeeeeeeee/WindsurfAPI`
  - 相关提交：`4dbf34c`, `fba4351`
  - 价值：可能改善 sub2api 展示的缓存命中或 usage 统计。
  - 风险：影响 usage/计费语义，需要结合实际账单或 sub2api 展示验证。
- 账号/模型冷却：
  - 来源：`snakeeeeeeeee/WindsurfAPI`
  - 相关提交：`431ae24`
  - 价值：多账号池运维可能有帮助。
  - 风险：不是 Claude Code 当前问题核心，合入前需要确认部署形态。

## 明确不建议当前合并的功能

- 动态代理 / 高可用 / 控制台配置：影响面大，涉及数据库、运行时配置和部署模型变化。
- Docker 构建阶段安装 LS：会改变镜像契约；用户当前倾向 GitHub/Docker 构建，本地轻验证。
- NarraFork 相关历史清理和指纹兼容：目标客户端不匹配 Claude Code/sub2api 路径。
- Cascade 禁用历史裁剪：存在 token/payload 风险。
- 领先 314 个提交的模板类 fork：主要是旧上游快照和文档提交，当前上游已包含运行时修复的更新版本。

## 验证策略

本地资源有限，优先做轻量验证；需要完整镜像构建时，优先走 GitHub/Docker 流程。

轻量验证命令：

```bash
node --check src/handlers/messages.js && node --check src/handlers/chat.js
node --test test/messages.test.js test/chat-reuse.test.js test/tool-emulation.test.js test/tool-preamble-budget.test.js
git diff --check
docker compose config
```

注意：

- `docker compose config` 可能展开 `.env` 内容；对外总结时不要泄露敏感值。
- 不要在没有必要时做重型本地构建或长时间集成测试。
- 如果修改 Claude Code 工具流、compact、会话复用或 usage 统计，应优先补充针对性回归测试。

## 操作要点

- 先读当前代码和测试，再决定是否合并 fork 逻辑。
- 只合并与本项目用途直接相关、影响面可控、能轻量验证的改动。
- 对 fork 里的大范围重构、运维功能、控制台功能、数据库变更保持保守。
- 合并外部提交时不要机械 cherry-pick；应按当前代码结构适配实现。
- 推送前检查：
  - `git status --short --branch`
  - 必要的 `node --check` / `node --test`
  - `git diff --check`
- 不要还原用户未明确要求还原的改动。
