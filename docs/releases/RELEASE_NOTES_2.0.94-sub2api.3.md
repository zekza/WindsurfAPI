# v2.0.94-sub2api.3

本版本面向 sub2api + Claude Code 部署，加入任务完成后的停止策略软约束，并保留上一版已合入的 compact、LS 自动重启和输出去重修复。

## 变更

- 默认 `communicationWithTools` 系统提示词增加结束态约束：
  - 完成任务后先给出简洁 Summary。
  - Summary 后停止。
  - 除非用户最新消息明确要求继续，否则不要继续调用工具。
  - 不重复分析或重复执行已完成检查。
- 旧默认 `communicationWithTools` 会自动迁移到新默认。
- 用户自定义过的 `communicationWithTools` 不会被覆盖。

## 验证

- `node --check src/runtime-config.js`
- `node --check test/runtime-config-prompts.test.js`
- `node --test test/runtime-config-prompts.test.js test/credentials-runtime.test.js test/messages.test.js test/tool-preamble-forbidden-words.test.js`
