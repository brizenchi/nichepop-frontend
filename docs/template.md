# 账户、付款、邀请：用的是 go-modules 网页模板（frontend#6）

登录、账户、订阅与账单、点数明细、邀请这几块的逻辑来自 go-modules `v0.3.0` 的网页模板
`templates/quickstart-nextjs`（提交 `7e2dc01`）。页面是 NichePop 自己按 `design.md` 的样式写的，
逻辑全部调用模板的 `lib/` 文件。

## 模板区：不要直接改

下面这些文件是从模板原样复制的。需要改动时，先到 go-modules 提 issue，在模板里改好，再复制回来。

- `lib/`：`api.ts`、`auth.ts`、`env.ts`、`locale.ts`、`format.ts`、`oauth-flow.ts`、`oauth-exchange.ts`、
  `auth-methods.ts`、`sign-in-methods-cache.ts`、`pricing-checkout.ts`、`pricing-subscription-cache.ts`、
  `billing-intent.ts`、`billing-presentation.ts`、`billing-selection.ts`、`billing-state.ts`、`billing-money.ts`、
  `credit-checkout.ts`、`customer-records.ts`、`account-summary.ts`、`account-actions.ts`、
  `subscription-management.ts`、`subscription-change.ts`、`payment-history.ts`、`request-state.ts`、
  `request-generation.ts`、`resource-data.ts`、`operations-api.ts`、`page-return.ts`
- `components/use-page-return.ts`
- `tests/` 下的全部测试和 `scripts/run-tests.mjs`（`npm test` 运行，编译配置在 `tsconfig.test.json`）

### 和模板不一样的地方

改动处都标了 `NICHEPOP`，升级模板时要重新加上：

| 文件 | 改了什么 | 原因 |
|---|---|---|
| `lib/oauth-flow.ts` | `CUSTOMER_RETURN_PATHS` 加了 `/ask`、`/trends`、`/monitors`、`/usage` | Google 登录后要能回到工作台页面 |
| `tests/env.test.ts` | 品牌名断言改成 `NichePop` | 品牌名来自 `content/site.ts` |

`content/site.ts` 是 NichePop 自己的文件，模板的 `lib/env.ts` 从这里读品牌名。

## NichePop 自己的部分

| 文件 | 作用 |
|---|---|
| `hooks/use-account.tsx` | 全站的登录状态（`AccountProvider` / `useAccount`）：当前用户、套餐、点数（`GET /usage`）、退出登录 |
| `hooks/use-account-resource.ts` | 读一个账户接口，规则同模板的 `useConsoleResource` |
| `lib/account.ts` | `GET /usage` 的类型，以及 NichePop 的点数来源名称 |
| `components/auth/sign-in-form.tsx` | 登录表单：邮箱验证码、Google；显示哪些方式由 `GET /capabilities` 决定 |
| `components/LoginDialog.tsx` | 登录弹窗（`hooks/use-auth-gate.tsx` 等都用它） |
| `components/account/` | 账户页面的公共组件、付款记录、改套餐弹窗、购买点数后的确认提示 |
| `components/payment/use-plan-checkout.tsx` | 定价页和升级弹窗的购买：调用模板的 `lib/pricing-checkout.ts` |
| `components/monitors/use-plan.ts` | 套餐额度和剩余点数：登录后读 `GET /usage`，未登录时用演示数据 |
| `lib/i18n/account.ts`、`billing.ts`、`referrals.ts` | 这些页面的中英文文案（界面里叫"点数 / points"） |

## 页面

| 页面 | 内容 | 接口 |
|---|---|---|
| `/login` | 登录；也是 Google 登录完成后的落点（`?code=&flow=`、`?oauth_error=`），登录后默认去 `/ask` | `/capabilities`、`/auth/*` |
| `/auth/callback` | 旧地址，带着参数转到 `/login`（`next.config.mjs`） | — |
| `/account` | 登录邮箱、套餐、退出登录 | `/account/membership` |
| `/billing` | 当前套餐、剩余点数、取消/恢复续费、改套餐、付款记录和发票 | `/stripe/*`、`/billing/purchases`、`/account/membership`、`/credits` |
| `/credits` | 剩余点数、即将到期、每一笔收支 | `/credits`、`/credits/transactions` |
| `/referrals` | 邀请链接、邀请统计和记录 | `/referral/*` |
| `/invite?ref=` | 被邀请的人注册前记住邀请码 | — |
| `/usage` | 本月点数、监控、X 帖子用量和最近的点数记录 | `/usage`、`/credits/transactions` |

工作台侧栏的点数、头像菜单里的点数和 `/credits` 是同一个数字（`GET /usage` 的 `credits.balance`）。
Ask AI 的回答还是演示（frontend#10 接真实 Agent）。

购买：定价页按钮 → 未登录先登录（Google 登录回来后继续这次购买）→ 已有订阅时在弹窗里改套餐，
否则去 Stripe 付款 → 付款后回到 `/billing?checkout=success`，页面会自动刷新几次直到套餐生效。

任何接口返回 401 都会清掉登录状态（模板 `apiRequest`），页面回到"登录后继续"。

## 环境变量

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 后端地址，**包含** `/api/v1`，例如 `https://api.nichepop.app/api/v1` |
| `NEXT_PUBLIC_APP_URL` | 网站地址，例如 `https://nichepop.app`；Stripe 付款后跳回这里 |
| `NEXT_PUBLIC_DEMO_MODE` | `true` 时工作台用演示数据、跳过登录拦截，可以不配后端 |
| `NEXT_PUBLIC_AUTH_EMAIL_ENABLED`、`NEXT_PUBLIC_AUTH_OAUTH_PROVIDERS` | 可选，在后端开启的登录方式里再关掉一些 |
| `NEXT_PUBLIC_ADMIN_URL` | 可选，管理后台的地址（见下） |

`next build` 时如果没配前两个（且不是演示模式）会直接报错，不会悄悄连到别的地址。

后端要配合的设置（`deploy/config.yaml`）：

- `auth.frontend_redirect: https://nichepop.app/login`
- `referral.base_link: https://nichepop.app/invite?ref=`
- `http.allowed_origins` 包含网站域名

## 升级模板

1. 从新版本的 `templates/quickstart-nextjs` 复制上面"模板区"的文件和 `tests/`。
2. 重新加上"和模板不一样的地方"那张表里的改动。
3. `npm test`、`npm run lint`、`npm run build` 都通过后再提交。

## 管理后台

管理后台不放进这个网站，而是把 go-modules 的 `templates/quickstart-nextjs` **原样单独部署**
（2026-11-22 确认），例如 `https://admin.nichepop.app`，连同一个 API。升级时换成新版本的模板即可，
这里不用改代码。部署和后端配置见后端仓库的 `docs/deploy.md`「网页」一节。

- 本站设置 `NEXT_PUBLIC_ADMIN_URL`（例如 `https://admin.nichepop.app`）后，`/admin` 会跳到那里，
  管理员的头像菜单里多一个"管理后台"。
- 管理员在后台用邮箱 + 密码登录（后端的 `APP_AUTH_ADMIN_EMAIL`、`APP_AUTH_ADMIN_PASSWORD`）。
