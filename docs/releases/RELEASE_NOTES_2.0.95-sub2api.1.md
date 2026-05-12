# v2.0.95-sub2api.1

本版本基于官方 `v2.0.95` 做选择性集成，保留本仓库面向 sub2api / Claude Code 的专项修复，不整体合并 Dashboard 大改。

## 集成内容

- 跟进官方 `#175`：修正 Linux arm64 / macOS 的 Language Server 默认二进制路径，并为 macOS 本地运行默认使用用户可写的 `~/.windsurf/data`。
- 选择性接入官方 `#162` 的 sticky session 思路，但默认关闭：
  - `STICKY_SESSION_ENABLED=1` 才启用。
  - 本地实现额外尊重 `excludeKeys/tried`，避免重试时再次选中已失败账号。
  - 该机制只是账号亲和兜底，Claude Code tool continuation 的主修复仍是 `v2.0.94-sub2api.6` 的 cascade continuation pool。
- 将 `ANTHROPIC_STREAM_PROVISIONAL_TEXT` 正式配置化；当前 Docker 默认 `1`，用于保留 Claude Code `tool_use` 中间阶段的总结可见性。

## 未集成内容

- 官方 `#173` Dashboard UI cleanup：与 sub2api / Claude Code 主路径无关，且改动面过大。
- 官方 `#163` LS auto-restart：本分支已有同类实现，暂不重复改动。

## 验证重点

- `node --test test/platform-ls-paths.test.js test/sticky-session.test.js`
- Claude Code 连续工具回合应继续优先命中 `reuse continuation HIT`，sticky 仅在显式启用时参与账号选择。
