# v2.0.94-sub2api.4

本版本修复 Claude Code 在工具调用链中把阶段性总结显示为最终回答，随后继续自动执行的问题。

## 变更

- `/v1/messages` 流式响应在请求声明 `tools` 时，先缓冲文本和 thinking。
- 如果该轮最终 `stop_reason=tool_use`，丢弃同轮工具调用前的阶段性文本，只输出 `tool_use`。
- 如果该轮最终 `stop_reason=end_turn` / `max_tokens`，正常输出文本。
- 不拦截 `AskUserQuestion`，也不按文本内容粗暴判断是否停止。

## 原因

Claude Code 会把 `stop_reason=tool_use` 视为工具链中间态。旧行为会先把模型的阶段性总结流给 Claude Code，再以 `tool_use` 结束；工具结果回来后 Claude Code 自动续给模型，用户看到像是“总结后又自动继续执行”。

## 验证

- `node --check src/handlers/messages.js`
- `node --test test/messages.test.js`
- `node --test test/messages.test.js test/tool-emulation.test.js test/tool-preamble-budget.test.js test/runtime-config-prompts.test.js`
- `git diff --check`
