import { rulesTemplate } from "./rules";

export type RuleOptionKey =
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

export type RuleOptions = Partial<Record<RuleOptionKey, boolean>>;

export const defaultRuleOptions: Required<RuleOptions> = {
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

type ClashValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClashValue[]
  | { [key: string]: ClashValue };

type ClashProxy = {
  name: string;
  type: "vless";
  server: string;
  port: number;
  uuid: string;
  udp: boolean;
  network?: string;
  tls?: boolean;
  servername?: string;
  "client-fingerprint"?: string;
  alpn?: string[];
  flow?: string;
  "reality-opts"?: {
    "public-key"?: string;
    "short-id"?: string;
    "spider-x"?: string;
  };
  "ws-opts"?: {
    path: string;
    headers?: { Host: string };
  };
  "grpc-opts"?: {
    "grpc-service-name"?: string;
  };
  "h2-opts"?: {
    path: string;
    host?: string[];
  };
};

const baseTemplate = rulesTemplate.replace(/\nprepend-rules:[\s\S]*$/m, "").trim();

export function generateClashConfig(input: string, options: RuleOptions = {}): string {
  const links = parseInput(input);

  if (links.length === 0) {
    throw new Error("没有找到 vless:// 节点。");
  }

  const proxies = links.map(parseVless);
  const rules = buildRules(normalizeRuleOptions(options));

  return [
    "port: 7890",
    "socks-port: 7891",
    "allow-lan: false",
    "mode: rule",
    "log-level: info",
    "",
    "proxies:",
    toYaml(proxies, 2),
    "",
    baseTemplate,
    "",
    "rules:",
    ...rules.map((rule) => `  - ${rule}`),
    "",
  ].join("\n");
}

export function normalizeRuleOptions(options: RuleOptions = {}): Required<RuleOptions> {
  return { ...defaultRuleOptions, ...options };
}

export function parseRuleOptions(value: unknown): RuleOptions {
  if (!value || typeof value !== "object") return {};

  const result: RuleOptions = {};
  for (const key of Object.keys(defaultRuleOptions) as RuleOptionKey[]) {
    const item = (value as Record<string, unknown>)[key];
    if (typeof item === "boolean") result[key] = item;
  }

  return result;
}

export function parseInput(text: string): string[] {
  return maybeDecodeBase64(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function maybeDecodeBase64(text: string): string {
  const compact = text.trim().replace(/\s+/g, "");
  if (!compact || compact.includes("://")) return text;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(compact)) return text;

  try {
    const normalized = compact.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    return decoded.includes("://") ? decoded : text;
  } catch {
    return text;
  }
}

function buildRules(options: Required<RuleOptions>): string[] {
  const rules: string[] = [];

  if (options.ai) {
    rules.push(
      "DOMAIN-SUFFIX,openai.com,AI 服务",
      "DOMAIN-SUFFIX,chatgpt.com,AI 服务",
      "DOMAIN-SUFFIX,oaistatic.com,AI 服务",
      "DOMAIN-SUFFIX,oaiusercontent.com,AI 服务",
      "DOMAIN-SUFFIX,anthropic.com,AI 服务",
      "DOMAIN-SUFFIX,claude.ai,AI 服务",
      "DOMAIN-SUFFIX,gemini.google.com,AI 服务",
      "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI 服务",
      "DOMAIN-SUFFIX,makersuite.google.com,AI 服务",
      "DOMAIN-KEYWORD,openai,AI 服务",
      "DOMAIN-KEYWORD,anthropic,AI 服务",
      "RULE-SET,category-ai-!cn,AI 服务",
    );
  }

  if (options.ads) rules.push("RULE-SET,category-ads-all,广告拦截");
  if (options.youtube) rules.push("RULE-SET,youtube,油管视频");

  if (options.google) {
    rules.push("RULE-SET,google,谷歌服务", "RULE-SET,google-ip,谷歌服务,no-resolve");
  }

  if (options.github) rules.push("RULE-SET,github,Github");
  if (options.microsoft) rules.push("RULE-SET,microsoft,微软服务");
  if (options.apple) rules.push("RULE-SET,apple,苹果服务");

  if (options.social) {
    rules.push(
      "RULE-SET,facebook,社交媒体",
      "RULE-SET,instagram,社交媒体",
      "RULE-SET,twitter,社交媒体",
      "RULE-SET,tiktok,社交媒体",
    );
  }

  if (options.streaming) {
    rules.push("RULE-SET,netflix,流媒体", "RULE-SET,disney,流媒体");
  }

  if (options.games) rules.push("RULE-SET,steam,游戏平台");

  if (options.cn) {
    rules.push(
      "RULE-SET,geolocation-cn,国内服务",
      "RULE-SET,cn,国内服务",
      "RULE-SET,cn-ip,国内服务,no-resolve",
    );
  }

  if (options.global) rules.push("RULE-SET,geolocation-!cn,非中国");
  rules.push("RULE-SET,private-ip,私有网络,no-resolve");

  if (options.telegram) rules.push("RULE-SET,telegram-ip,电报消息,no-resolve");

  rules.push("MATCH,漏网之鱼");
  return rules;
}

function parseVless(uri: string, index: number): ClashProxy {
  const url = new URL(uri);

  if (url.protocol !== "vless:") {
    throw new Error(`只支持 vless:// 节点：${uri}`);
  }

  const search = url.searchParams;
  const name = decodeURIComponent(url.hash ? url.hash.slice(1) : `VLESS-${index + 1}`);
  const network = param(search, "type", "network");
  const security = param(search, "security");

  const proxy: ClashProxy = {
    name,
    type: "vless",
    server: url.hostname,
    port: Number(url.port),
    uuid: decodeURIComponent(url.username),
    udp: boolParam(search, "udp") ?? true,
  };

  if (network && network !== "tcp") proxy.network = network;

  if (security === "tls" || security === "reality") {
    proxy.tls = true;
    proxy.servername = param(search, "sni", "servername");
    proxy["client-fingerprint"] = param(search, "fp", "fingerprint");

    const alpn = param(search, "alpn");
    if (alpn) proxy.alpn = alpn.split(",");
  }

  const flow = param(search, "flow");
  if (flow) proxy.flow = flow;

  if (security === "reality") {
    proxy["reality-opts"] = {
      "public-key": param(search, "pbk", "publicKey", "public-key"),
      "short-id": param(search, "sid", "shortId", "short-id"),
      "spider-x": param(search, "spx", "spiderX", "spider-x"),
    };
  }

  if (network === "ws") {
    const host = param(search, "host");
    proxy["ws-opts"] = {
      path: param(search, "path") || "/",
      headers: host ? { Host: host } : undefined,
    };
  }

  if (network === "grpc") {
    proxy["grpc-opts"] = {
      "grpc-service-name": param(search, "serviceName", "service-name"),
    };
  }

  if (network === "http" || network === "h2") {
    const host = param(search, "host");
    proxy["h2-opts"] = {
      path: param(search, "path") || "/",
      host: host ? host.split(",") : undefined,
    };
  }

  if (!proxy.server || !proxy.port || !proxy.uuid) {
    throw new Error(`节点缺少 server、port 或 uuid：${uri}`);
  }

  return proxy;
}

function param(search: URLSearchParams, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = search.get(name);
    if (value !== null && value !== "") return value;
  }
  return undefined;
}

function boolParam(search: URLSearchParams, name: string): boolean | undefined {
  const value = search.get(name);
  if (value === null || value === "") return undefined;
  return ["1", "true", "yes"].includes(value.toLowerCase());
}

function toYaml(value: ClashValue, indent = 0): string {
  const pad = " ".repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;

    return value
      .map((item) => {
        if (item && typeof item === "object") {
          const rendered = toYaml(item, indent + 2).trimStart();
          return `${pad}- ${rendered}`;
        }

        return `${pad}- ${formatScalar(item)}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, child]) => {
        if (child === undefined || child === "") return false;
        return !(Array.isArray(child) && child.length === 0);
      })
      .map(([key, child]) => {
        if (child && typeof child === "object") {
          return `${pad}${key}:\n${toYaml(child, indent + 2)}`;
        }

        return `${pad}${key}: ${formatScalar(child)}`;
      })
      .join("\n");
  }

  return `${pad}${formatScalar(value)}`;
}

function formatScalar(value: ClashValue): string {
  if (value === true) return "true";
  if (value === false) return "false";
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);

  const text = String(value);
  if (/^[A-Za-z0-9_.:/@%+=,!-]+$/.test(text) && !["true", "false", "null"].includes(text)) {
    return text;
  }

  return JSON.stringify(text);
}
