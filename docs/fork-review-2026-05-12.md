# 分叉仓库对比记录 - 2026-05-12

背景：本仓库当前用途是接入 sub2api，并通过 Anthropic `/v1/messages` 接口供 Claude Code 使用。因此本次对比优先关注会影响 Claude Code 工具流、会话复用、缓存计量、流式响应、Docker/sub2api 部署和模型路由的改动。

## 检查方法

- 分叉仓库列表来源：`gh api repos/dwgx/WindsurfAPI/forks --paginate`，随后本地 `git fetch` 各分支头。
- 排名指标：`git rev-list --left-right --count origin/master...refs/tmp/forks/<owner>_<repo>`。
- 本地实际抓取并检查过的分叉仓库引用：324 个。
- 重要说明：很多分叉仓库的领先提交数很高，是因为它们基于较旧的上游历史，同时也落后上游 318 个提交。因此提交数量不能直接作为合并依据，必须看具体差异和当前上游是否已有等价实现。

## 领先提交数前 20 快照

| 排名 | 分叉仓库 | 领先提交数 | 落后提交数 | 最近提交时间 |
| --- | --- | ---: | ---: | --- |
| 1 | snakeeeeeeeee/WindsurfAPI | 336 | 318 | 2026-05-10T18:31:43+08:00 |
| 2 | vivy1024/WindsurfAPI | 318 | 318 | 2026-05-10T03:14:34+08:00 |
| 3 | AEIKAN/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 4 | Ezhuk1/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 5 | GlobalCryptoSolutions/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 6 | Glucoamine/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 7 | Hastingson/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 8 | HotOpenSourcing/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 9 | Humpyt/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 10 | JulioCesarHE/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 11 | Kamisato520/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 12 | OmarHalima/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 13 | OpenSorceYCW/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 14 | StephenLovino/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 15 | TeoDoe777/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 16 | Wuya1/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 17 | abt0y/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 18 | ai-begining/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 19 | aquariusluo/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |
| 20 | billyville0/WindsurfAPI | 314 | 318 | 2026-05-09T08:27:58+09:00 |

## 详细检查记录

### snakeeeeeeeee/WindsurfAPI

实际检查到的未吸收功能点：

- 缓存行为：
  - `8fad83d`, `45166f5`, `a3898b2`, `a93e084`, `09809e0`, `3b05435`, `9d3b0f8`, `c28bb0d`, `05627d7`, `92a66b3`, `6e38170`
  - 涉及 `chat.js`、`messages.js`、测试和环境变量的较大范围缓存改动。
  - 结论：未合入。范围过大，当前目标不是重构缓存层；当前上游也已经有较完整的缓存计量修复，这部分需要单独评审。
- 动态代理 / 高可用 / 控制台配置：
  - `67b7e83`, `c77e30a`, `4801ad6`, `1971aa4`, `ca1ef22`, `289d600`, `84070c3`, `0a3480b`, `d5790c9`
  - 新增或大改 `availability-router`、`availability-worker`、`db.js`、`dynamic-proxy.js`、控制台和 runtime-config。
  - 结论：未合入。影响面太大，涉及数据库和运行时模型变化，不是 sub2api + Claude Code 当前路径的必要改动。
- 首字延迟 / 可观测性：
  - `c30173f`, `f3f8f14`
  - 在 `client.js`、`conversation-pool.js`、`messages.js` 增加耗时诊断。
  - 结论：未合入。后续排障可能有价值，但不是本次问题的直接修复。
- 会话复用 / 工具链：
  - `ed55a5c`：把连续尾部工具消息当成同一个最新输入参与指纹计算。
  - `f7fed1b`：处理工具链复用 MISS。
  - `79a1608`：优化 Cascade 复用与冷无输出重试。
  - `5e3ba04`：优化复用指纹，并增加运行时开关。
  - 结论：暂未合入。这些和 Claude Code 连续性相关，但当前上游已经有严格复用、checkout 恢复、alias 写入、超时失效等机制。直接合入会改变复用语义，需要后续单独做会话池审计。
- 流式分支 context 问题：
  - `3f0a68d` 修复流式限流分支 `context` 未定义。
  - 结论：未合入。当前代码已经通过 `streamResponse` deps 传入 `context`，不再直接匹配旧故障形态。
- 账号/模型冷却：
  - `431ae24` 持久化账号模型冷却，并调整批量 probe 行为。
  - 结论：未合入。属于运维体验优化，不是本次目标。
- Anthropic 缓存用量：
  - `4dbf34c`, `fba4351`
  - 调整 Anthropic cache usage 上报和目标命中率补写。
  - 结论：未合入。当前上游已有 v2.0.68+ 的 cache usage 映射；这部分涉及计费语义，需要单独验证。
- Cascade 历史裁剪：
  - `5edb374` 禁用 Cascade 历史裁剪。
  - 结论：未合入。对 sub2api 部署有潜在 token/payload 风险。
- Claude CLI compact 修复：
  - `8590a84` 修复 compact 摘要被误解析为工具调用。
  - `6c9d31e` 收窄 compact 检测范围，只看最新 user 消息，避免 compact 后续“继续”请求仍被强制纯文本。
  - 结论：已按当前代码结构适配合入。该问题与用户反馈高度匹配：Claude Code 任务结束或 compact/summary 回合后，摘要里的 tool-shaped 文本可能被翻译成 `tool_use`，导致 Claude Code 继续执行。

### vivy1024/WindsurfAPI

实际检查到的未吸收功能点：

- `b200f2c`：Docker 构建阶段安装 LS，带重试，并隐藏导出文件名。
  - 结论：未合入。用户要求尽量走 GitHub 构建/Docker，本地轻验证；构建阶段安装 LS 会改变镜像契约，需要单独确认。
- `9dd5e5a`, `779eb5a`, `fad397c`, `a364f97`：NarraFork 客户端历史清理和指纹兼容。
  - 结论：未合入。这些针对 NarraFork 特定 metadata/history 形态，不是 Claude Code/sub2api 路径。
- `81384f5`：旧版上游 release commit。
  - 结论：未合入。当前上游已经是 v2.0.94。

### 领先 314 个提交的模板类分叉仓库

抽样检查过：

- AEIKAN/WindsurfAPI
- Ezhuk1/WindsurfAPI
- GlobalCryptoSolutions/WindsurfAPI
- Glucoamine/WindsurfAPI
- Hastingson/WindsurfAPI
- cautionsign/WindsurfAPI
- stophobia/windsurfapi
- maxdosme/WindsurfAPI

观察到的未吸收提交：

- `81384f5 release: 2.0.91 ...`
- `8a0c598 docs: update CLAUDE.md with session knowledge`

结论：未合入。这些分叉仓库基本是旧上游快照加一个仅文档的 CLAUDE.md 更新；其中运行时修复当前上游已经以更新形式包含。

### 额外检查过的旧高领先提交数分叉仓库

- chrischen191912-tech/WindsurfAPI
  - 主要是 v2.0.90 及更早时期的旧上游 release 修复。
  - 结论：未合入；当前上游已经包含这些方向的更新实现。
- hanang128/WindsurfAPI
  - 包含较早的 tool preamble compaction、prompt caching、工具流、Claude Code pool isolation 等修复。
  - 结论：未合入；当前上游已经有分层 preamble 压缩、caller sub-key 隔离、strict reuse 和相关测试。

## 已集成改动

从 `snakeeeeeeeee/WindsurfAPI` 适配合入：

- `8590a84 fix: 修复 Claude CLI compact 摘要被误解析为工具调用`
- `6c9d31e fix: 修复 Claude CLI compact 后续请求误判为纯文本模式`

本分支内的实现：

- `src/handlers/messages.js`
  - 新增 `isAnthropicConversationCompactionRequest()`。
  - 只根据最新 user 消息识别 compact/summary 回合。
  - compact 当轮移除 tools/tool_choice，并传入 `__forceTextResponse`。
- `src/handlers/chat.js`
  - 支持 `__forceTextResponse`。
  - 保留历史 tool_use/tool_result 作为上下文。
  - compact 当轮禁止输出 tool-call parsing/native bridge，保证摘要按纯文本返回。
- `test/messages.test.js`
  - 增加 compact 回归测试。
  - 修正 `web_search_20250305` 测试期望，使其匹配当前 v2.0.93 的转换行为。
- `docker-compose.yml`
  - 保留 sub2api 外部网络接入和本机端口绑定。

## 验证记录

- `node --check src/handlers/messages.js && node --check src/handlers/chat.js`
- `node --test test/messages.test.js test/chat-reuse.test.js test/tool-emulation.test.js test/tool-preamble-budget.test.js`
  - 结果：109/109 通过。
- `git diff --check`
- `docker compose config`
