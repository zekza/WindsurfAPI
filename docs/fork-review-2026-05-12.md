# Fork review — 2026-05-12

Context: this repository is deployed behind sub2api and is used by Claude Code through the Anthropic `/v1/messages` surface. The review therefore prioritized changes that affect Claude Code tool flow, conversation reuse, cache accounting, stream behavior, Docker/sub2api deployment, and model routing.

## Method

- Fork list source: `gh api repos/dwgx/WindsurfAPI/forks --paginate`, then local `git fetch` of fork heads.
- Ranking metric: `git rev-list --left-right --count origin/master...refs/tmp/forks/<owner>_<repo>`.
- Local refs inspected: 324 fork heads.
- Important caveat: many forks are `ahead` only because they are based on older upstream history. They are also `behind=318`, so commit count alone is not a merge signal.

## Ahead ranking snapshot

| Rank | Fork | Ahead | Behind | Last commit |
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

## Detailed review

### snakeeeeeeeee/WindsurfAPI

Unique unmerged areas checked:

- Cache behavior:
  - `8fad83d`, `45166f5`, `a3898b2`, `a93e084`, `09809e0`, `3b05435`, `9d3b0f8`, `c28bb0d`, `05627d7`, `92a66b3`, `6e38170`
  - Broad cache changes across `chat.js`, `messages.js`, tests, and env knobs.
  - Decision: not merged. Too broad for the current target; current upstream already has substantial cache accounting fixes, and this needs isolated review.
- Dynamic proxy / HA / dashboard configuration:
  - `67b7e83`, `c77e30a`, `4801ad6`, `1971aa4`, `ca1ef22`, `289d600`, `84070c3`, `0a3480b`, `d5790c9`
  - Adds `availability-router`, `availability-worker`, `db.js`, `dynamic-proxy.js`, large dashboard/runtime-config changes.
  - Decision: not merged. High blast radius, database/runtime model changes, and not required for sub2api Claude Code path.
- First-token / observability:
  - `c30173f`, `f3f8f14`
  - Adds timing diagnostics in `client.js`, `conversation-pool.js`, `messages.js`.
  - Decision: not merged. Useful for later troubleshooting but not a direct fix.
- Conversation reuse / tool chain:
  - `ed55a5c` trailing tool messages in fingerprint.
  - `f7fed1b` tool-chain reuse MISS handling.
  - `79a1608` cold no-output retry and reuse tweaks.
  - `5e3ba04` reuse fingerprint runtime switches.
  - Decision: not merged now. Related to Claude Code continuity, but current upstream already has strict reuse, checkout restore, aliasing, and timeout invalidation. These need a separate conversation-pool audit to avoid changing reuse semantics blindly.
- Stream context bug:
  - `3f0a68d` fixes a stream rate-limit branch `context` reference.
  - Decision: not merged. Current code already passes `context` into `streamResponse` deps and does not match the old failure shape directly.
- Account/model cooldown:
  - `431ae24` persists per-account model cooldown and changes batch probe behavior.
  - Decision: not merged. Operationally interesting but outside current goal.
- Anthropic cache usage:
  - `4dbf34c`, `fba4351`
  - Changes reported Anthropic cache usage and target hit-rate padding.
  - Decision: not merged. Current upstream already has v2.0.68+ cache usage mapping; these need billing-specific validation before adoption.
- Cascade history trimming:
  - `5edb374`
  - Disables Cascade history trimming.
  - Decision: not merged. Potential token/payload risk for sub2api deployment.
- Claude CLI compact fixes:
  - `8590a84` fixes compact summaries being parsed as tool calls.
  - `6c9d31e` narrows compact detection to latest user message so later "continue" turns restore normal tool use.
  - Decision: merged in adapted form. This directly matches the reported symptom: Claude Code can continue running after a task because a compaction/summary response with tool-shaped text is translated into `tool_use`.

### vivy1024/WindsurfAPI

Unique unmerged areas checked:

- `b200f2c` Docker build-time LS install with retry and export filename redaction.
  - Decision: not merged. The user asked to use GitHub build/Docker where appropriate and keep local validation light; build-time LS install changes the image contract.
- `9dd5e5a`, `779eb5a`, `fad397c`, `a364f97` NarraFork client history sanitation/fingerprint handling.
  - Decision: not merged. These target NarraFork-specific metadata/history shapes, not Claude Code/sub2api.
- `81384f5` release commit equivalent to older upstream release.
  - Decision: not merged. Current upstream is already v2.0.94.

### Template-like 314-ahead forks

Checked examples:

- AEIKAN/WindsurfAPI
- Ezhuk1/WindsurfAPI
- GlobalCryptoSolutions/WindsurfAPI
- Glucoamine/WindsurfAPI
- Hastingson/WindsurfAPI
- cautionsign/WindsurfAPI
- stophobia/windsurfapi
- maxdosme/WindsurfAPI

Observed unmerged commits:

- `81384f5 release: 2.0.91 ...`
- `8a0c598 docs: update CLAUDE.md with session knowledge`

Decision: not merged. These forks are mostly old upstream snapshots plus a docs-only CLAUDE.md update. Runtime fixes from those histories are already present in current upstream, usually in newer form.

### Older high-ahead forks inspected for historical fixes

- chrischen191912-tech/WindsurfAPI
  - Mostly older upstream release commits up to v2.0.90-era changes.
  - Decision: not merged; current upstream already includes those concepts in newer code.
- hanang128/WindsurfAPI
  - Included older fixes for tool preamble compaction, prompt caching, tool flow, and Claude Code pool isolation.
  - Decision: not merged; current upstream already has tiered preamble compaction, caller sub-key isolation, strict reuse, and related tests.

## Integrated changes

Merged/adapted from `snakeeeeeeeee/WindsurfAPI`:

- `8590a84 fix: 修复 Claude CLI compact 摘要被误解析为工具调用`
- `6c9d31e fix: 修复 Claude CLI compact 后续请求误判为纯文本模式`

Implementation in this branch:

- `src/handlers/messages.js`
  - Adds `isAnthropicConversationCompactionRequest()`.
  - Detects compact/summary turns from the latest user message only.
  - Removes current-turn tools/tool_choice for compact turns and passes `__forceTextResponse`.
- `src/handlers/chat.js`
  - Honors `__forceTextResponse`.
  - Keeps prior tool history in context.
  - Suppresses output tool-call parsing/native bridge for that compact turn.
- `test/messages.test.js`
  - Adds compact regression tests.
  - Updates `web_search_20250305` expectation to match current v2.0.93 conversion behavior.
- `docker-compose.yml`
  - Keeps sub2api network integration and localhost-only host port binding.

## Verification

- `node --check src/handlers/messages.js && node --check src/handlers/chat.js`
- `node --test test/messages.test.js test/chat-reuse.test.js test/tool-emulation.test.js test/tool-preamble-budget.test.js`
  - Result: 109/109 passing.
- `git diff --check`
- `docker compose config`

