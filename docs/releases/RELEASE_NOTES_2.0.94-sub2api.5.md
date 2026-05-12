# v2.0.94-sub2api.5

本版本继续收敛 Claude Code 工具链自动续跑问题，补充 tool_result 回合语义约束，并增强账号复用链路诊断日志。

## 变更

- synthetic `<tool_result>` user turn 后追加元信息：
  - 该内容是上一轮工具调用结果，不是新的用户请求。
  - 只能用于继续完成最近一条真实用户请求。
  - 如果工具结果已经足够，应给出最终答案并停止。
  - 只有严格必要时才继续调用工具。
- stream / non-stream 请求日志增加脱敏诊断字段：
  - `caller`：`callerKey` 的短哈希，用于判断同一 Claude Code 工具链后续请求是否换了调用者作用域。
  - `scoped`：是否具备 per-user / per-client 作用域。
  - `toolResults` / `assistantToolCalls`：用于识别 tool_result 续跑回合。
  - `reuse fp ... HIT/MISS`：用于判断是否命中 cascade conversation pool。
  - `account=key:<hash>/email:<hash>`：实际使用的 Windsurf 账号脱敏标签，用于确认是否换账号。

## 原因

Claude Code 会把 tool_result 自动送回模型。模型可能在没有真实新用户输入时自我判断继续探索，例如输出 “The user hasn't asked a new question yet” 后仍读取更多文件。本版本通过 tool_result 包装层明确语义，降低模型把工具结果当成新任务触发器的概率。

同时，用户反馈需要确认 tool_result 后续请求是否落到了另一个 Windsurf 账号，导致上游没有上一轮上下文。当前复用逻辑只有在 cascade pool 命中时才会锁回原账号；如果 `callerKey`、fingerprint、LS 或账号可用性导致复用 miss，后续请求可能重新从账号池取账号。新增日志用于直接抓取该链路证据。

## 验证

- `node --check src/handlers/tool-emulation.js`
- `node --check src/handlers/chat.js`
- `node --test test/tool-emulation.test.js test/messages.test.js test/conversation-pool.test.js`
- `git diff --check`
- `docker compose config --quiet`
