"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";
type RuleKey =
  | "ads"
  | "ai"
  | "youtube"
  | "google"
  | "github"
  | "microsoft"
  | "apple"
  | "social"
  | "streaming"
  | "games"
  | "cn"
  | "telegram"
  | "global";

type RuleOptions = Record<RuleKey, boolean>;

const ruleItems: Array<{ key: RuleKey; label: string; description: string }> = [
  { key: "ads", label: "广告拦截", description: "category-ads-all 走 REJECT" },
  { key: "ai", label: "AI 服务", description: "OpenAI、Claude、Gemini 等强制代理" },
  { key: "youtube", label: "YouTube", description: "YouTube 独立策略组" },
  { key: "google", label: "Google", description: "Google 域名和 IP 规则" },
  { key: "github", label: "GitHub", description: "GitHub 相关域名" },
  { key: "microsoft", label: "微软", description: "Microsoft 服务" },
  { key: "apple", label: "苹果", description: "Apple 服务" },
  { key: "social", label: "社交", description: "Facebook、Instagram、X、TikTok" },
  { key: "streaming", label: "流媒体", description: "Netflix、Disney" },
  { key: "games", label: "游戏平台", description: "Steam" },
  { key: "cn", label: "国内直连", description: "CN 域名和 IP 直连" },
  { key: "telegram", label: "Telegram", description: "Telegram IP 规则" },
  { key: "global", label: "海外兜底", description: "geolocation-!cn 代理" },
];

const defaultOptions: RuleOptions = {
  ads: true,
  ai: true,
  youtube: true,
  google: true,
  github: true,
  microsoft: true,
  apple: true,
  social: true,
  streaming: true,
  games: true,
  cn: true,
  telegram: true,
  global: true,
};

export default function Home() {
  const [input, setInput] = useState("");
  const [slug, setSlug] = useState("");
  const [output, setOutput] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");
  const [options, setOptions] = useState<RuleOptions>(defaultOptions);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const envSubscriptionUrl = origin ? `${origin}/api/clash` : "部署后自动显示当前域名";

  async function generate() {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config: input, options }),
      });
      const text = await response.text();

      if (!response.ok) throw new Error(readError(text));

      setOutput(text);
      setStatus("ready");
      setMessage("已生成 YAML");
    } catch (error) {
      setOutput("");
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "转换失败。");
    }
  }

  async function createTemporaryLink() {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          config: input,
          options,
          slug: slug.trim() || undefined,
        }),
      });
      const text = await response.text();

      if (!response.ok) throw new Error(readError(text));

      const result = JSON.parse(text) as { url: string; expiresAt: string };
      setShortUrl(result.url);
      setExpiresAt(result.expiresAt);
      setStatus("ready");
      setMessage("已创建临时短链");
    } catch (error) {
      setShortUrl("");
      setExpiresAt("");
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "创建短链失败。");
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setMessage(`已复制${label}`);
  }

  function download() {
    const blob = new Blob([output], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clash.yaml";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function toggleRule(key: RuleKey) {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <main className="page-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">VLESS Clash Builder</p>
            <h1>生成可导入 Clash 的临时订阅短链</h1>
          </div>
          <span className={`status ${status}`}>{statusLabel(status)}</span>
        </header>

        <div className="layout-grid">
          <section className="panel input-panel">
            <div className="panel-header">
              <div>
                <h2>节点与短链</h2>
                <p>一行一个 VLESS 节点，或粘贴 base64 订阅内容。</p>
              </div>
              <button className="secondary" onClick={() => setInput("")} disabled={!input}>
                清空
              </button>
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
              placeholder="vless://uuid@example.com:443?security=reality&sni=...#node"
            />

            <div className="field-row">
              <label htmlFor="slug">自定义短链名</label>
              <input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="留空自动生成，例如 my-sub"
              />
            </div>

            <div className="actions">
              <button className="primary" onClick={createTemporaryLink} disabled={status === "loading" || !input.trim()}>
                创建临时短链
              </button>
              <button className="secondary" onClick={generate} disabled={status === "loading" || !input.trim()}>
                导出 YAML
              </button>
            </div>
          </section>

          <section className="panel rules-panel">
            <div className="panel-header">
              <div>
                <h2>基础规则</h2>
                <p>关闭某项后，对应 RULE-SET 不会写入最终 rules。</p>
              </div>
              <button className="secondary" onClick={() => setOptions(defaultOptions)}>
                全选
              </button>
            </div>

            <div className="rule-list">
              {ruleItems.map((item) => (
                <label className="rule-item" key={item.key}>
                  <input
                    type="checkbox"
                    checked={options[item.key]}
                    onChange={() => toggleRule(item.key)}
                  />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <section className="deploy-panel">
          <div>
            <h2>临时短链</h2>
            <p>保存在当前 Vercel 函数实例内存里，实例重启、冷启动或重新部署后可能失效。</p>
          </div>
          <div className="subscription-row">
            <code>{shortUrl || "创建后显示 /s/{slug} 订阅地址"}</code>
            <button className="secondary" onClick={() => copy(shortUrl, "临时短链")} disabled={!shortUrl}>
              复制
            </button>
          </div>
          {expiresAt ? <p className="meta-line">过期时间：{new Date(expiresAt).toLocaleString()}</p> : null}
        </section>

        <section className="deploy-panel">
          <div>
            <h2>固定订阅</h2>
            <p>
              在 Vercel 环境变量设置 <code>VLESS_CONFIG</code> 后，这个地址会稳定输出默认规则配置。
            </p>
          </div>
          <div className="subscription-row">
            <code>{envSubscriptionUrl}</code>
            <button className="secondary" onClick={() => copy(envSubscriptionUrl, "固定订阅链接")}>
              复制
            </button>
          </div>
        </section>

        <section className="panel output-panel">
          <div className="panel-header">
            <div>
              <h2>YAML 预览</h2>
              <p>导出的内容可以保存为 clash.yaml，或直接使用短链订阅。</p>
            </div>
            <div className="actions compact">
              <button className="secondary" onClick={() => copy(output, "YAML")} disabled={!output}>
                复制 YAML
              </button>
              <button className="secondary" onClick={download} disabled={!output}>
                下载
              </button>
            </div>
          </div>
          <pre className="output">{output || "点击“导出 YAML”后显示生成结果。"}</pre>
        </section>

        {message ? <p className={`toast ${status === "error" ? "error" : ""}`}>{message}</p> : null}
      </section>
    </main>
  );
}

function statusLabel(status: Status): string {
  if (status === "loading") return "处理中";
  if (status === "ready") return "完成";
  if (status === "error") return "错误";
  return "待命";
}

function readError(text: string): string {
  try {
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error || text || "请求失败。";
  } catch {
    return text || "请求失败。";
  }
}
