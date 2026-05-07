import { generateClashConfig, parseRuleOptions } from "@/lib/clash";

export const runtime = "nodejs";

function yamlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/yaml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const input = url.searchParams.get("config") || process.env.VLESS_CONFIG || "";
    const options =
      parseOptionsParam(url.searchParams.get("options")) ||
      parseOptionsParam(process.env.VLESS_RULE_OPTIONS || "") ||
      {};

    if (!input.trim()) {
      return errorResponse("缺少 config 参数，也没有配置 VLESS_CONFIG 环境变量。");
    }

    return yamlResponse(generateClashConfig(input, options));
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "转换失败。");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { config?: unknown; options?: unknown };
    const input = typeof body.config === "string" ? body.config : "";

    if (!input.trim()) {
      return errorResponse("请求体缺少 config 字段。");
    }

    return yamlResponse(generateClashConfig(input, parseRuleOptions(body.options)));
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "转换失败。");
  }
}

function parseOptionsParam(value: string | null): ReturnType<typeof parseRuleOptions> | null {
  if (!value?.trim()) return null;

  try {
    return parseRuleOptions(JSON.parse(value));
  } catch {
    return null;
  }
}
