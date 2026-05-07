import { generateClashConfig, parseRuleOptions } from "@/lib/clash";
import { createLink, LinkStoreError } from "@/lib/link-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      config?: unknown;
      options?: unknown;
      slug?: unknown;
      ttlSeconds?: unknown;
    };
    const config = typeof body.config === "string" ? body.config : "";
    const slug = typeof body.slug === "string" ? body.slug : undefined;
    const ttlSeconds = typeof body.ttlSeconds === "number" ? body.ttlSeconds : undefined;
    const options = parseRuleOptions(body.options);

    if (!config.trim()) {
      return Response.json({ error: "请求体缺少 config 字段。" }, { status: 400 });
    }

    generateClashConfig(config, options);

    const link = createLink({ slug, config, options, ttlSeconds });
    const url = new URL(request.url);
    const subscriptionUrl = `${url.origin}/s/${encodeURIComponent(link.slug)}`;

    return Response.json({
      slug: link.slug,
      url: subscriptionUrl,
      createdAt: new Date(link.createdAt).toISOString(),
      expiresAt: new Date(link.expiresAt).toISOString(),
      temporary: true,
    });
  } catch (error) {
    if (error instanceof LinkStoreError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "创建短链失败。" },
      { status: 400 },
    );
  }
}
