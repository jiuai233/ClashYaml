# VLESS Clash Builder

一个部署在 Vercel 上的 VLESS 转 Clash/Mihomo 订阅工具。

它可以把 `vless://` 节点转换成完整 Clash YAML，并自动带上内置的 DNS、策略组、规则集和基础分流规则。

## 功能

- 页面粘贴 VLESS 节点，一键导出 `clash.yaml`
- 支持一行一个 `vless://` 节点
- 支持粘贴 base64 格式订阅内容
- 支持开启/关闭基础规则
- 支持创建临时短链，Clash Verge 可直接导入
- 支持固定订阅地址 `/api/clash`

## 路由说明

```text
POST /api/convert
```

即时转换，不保存配置，页面“导出 YAML”使用这个接口。

```text
POST /api/links
```

创建临时短链，配置会保存到当前 Vercel 函数实例内存中。

```text
GET /s/{slug}
```

短链订阅地址，直接返回 Clash YAML，可以导入 Clash Verge。

```text
GET /api/clash
```

固定订阅地址，读取 Vercel 环境变量 `VLESS_CONFIG`。

## 临时短链说明

当前版本不使用 Redis、数据库或 KV。

临时短链保存在 Vercel 函数实例内存里，因此不是永久链接。以下情况可能导致短链失效：

- Vercel 函数冷启动
- 实例被回收
- 项目重新部署
- 请求被路由到另一个实例

这个设计适合临时分享和 MVP 使用。以后如果需要永久短链，只需要把 `lib/link-store.ts` 换成数据库、Vercel KV、Upstash Redis 或其他持久化存储。

## 本地开发

```bash
pnpm install
pnpm dev
```

打开：

```text
http://localhost:3000
```

## Vercel 部署

把仓库导入 Vercel，Framework 选择 Next.js。

如果你想使用固定订阅地址，需要在 Vercel 环境变量里配置：

```text
VLESS_CONFIG=vless://你的节点
```

可选配置：

```text
VLESS_RULE_OPTIONS={"ads":true,"ai":true,"cn":true}
```

部署后，Clash Verge 直接导入：

```text
https://你的域名/api/clash
```

如果你在页面里创建临时短链，导入地址类似：

```text
https://你的域名/s/my-sub
```

## 规则选项

支持的规则开关：

```text
ads         广告拦截
ai          AI 服务
youtube     YouTube
google      Google
github      GitHub
microsoft   微软服务
apple       苹果服务
social      社交媒体
streaming   流媒体
games       游戏平台
cn          国内直连
telegram    Telegram
global      海外兜底
```

默认全部开启。

## 注意

如果你把节点写进 Vercel 环境变量，访问 `/api/clash` 的人都可以拿到生成后的 Clash 配置。请只在你信任的范围内分享订阅地址。
