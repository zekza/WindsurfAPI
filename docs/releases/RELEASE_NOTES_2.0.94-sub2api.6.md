# v2.0.94-sub2api.6

本版本修复 Claude Code tool_result 续跑过程中 cascade 复用持续 miss、导致每轮换 Windsurf 账号的问题。

## 变更

- cascade pool 新增 tool continuation 兜底索引：
  - 精确 fingerprint 仍然优先。
  - 只有当前请求包含 `tool_result` 或 assistant `tool_calls`，且精确复用 miss 时，才按同一 `callerKey + model + route + system/tools 摘要 + 最近真实用户请求` 查找最近 cascade。
  - 命中后继续使用原 cascade 的 `apiKey` / LS 组合，避免工具结果续跑阶段重新轮询账号池。
- stream / non-stream checkin 时写入 continuation key。
- 日志新增 `reuse continuation HIT ...`，用于确认兜底复用是否生效。

## 原因

`.5` 的诊断日志确认：复现时 `caller` 全程一致，但每一轮 `reuse fp=... MISS`，并且 `account=key:...` 每轮不同。也就是说不是用户上下文作用域丢失，而是 cascade conversation pool 没命中，导致 tool_result 后续请求落到了不同 Windsurf 账号，上游服务端 cascade 上下文接不上，模型表现为“没有原始请求 / 继续询问用户要做什么”。

Claude Code 的工具链回合中，assistant 阶段性文本、tool_call 序列、tool_result 包装等内容会在后续请求里轻微漂移；严格 fingerprint 因此容易 miss。tool continuation 兜底只在工具续跑场景启用，并锚定最近真实用户请求，避免普通对话串会话。

## 验证

- `node --check src/conversation-pool.js`
- `node --check src/handlers/chat.js`
- `node --test test/conversation-pool.test.js test/messages.test.js test/tool-emulation.test.js test/tool-preamble-budget.test.js test/runtime-config-prompts.test.js`
- `git diff --check`
- `docker compose config --quiet`
