import { generateClashConfig, parseRuleOptions } from "@/lib/clash";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { config?: unknown; options?: unknown };
    const input = typeof body.config === "string" ? body.config : "";

    if (!input.trim()) {
      return Response.json({ error: "请求体缺少 config 字段。" }, { status: 400 });
    }

    return new Response(generateClashConfig(input, parseRuleOptions(body.options)), {
      headers: {
        "content-type": "text/yaml; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "转换失败。" },
      { status: 400 },
    );
  }
}
