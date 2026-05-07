import { generateClashConfig } from "@/lib/clash";
import { getLink } from "@/lib/link-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
): Promise<Response> {
  const link = getLink(params.slug);

  if (!link) {
    return Response.json(
      {
        error: "短链不存在或已经过期。Vercel 内存短链是临时的，实例重启后可能失效。",
      },
      { status: 404 },
    );
  }

  return new Response(generateClashConfig(link.config, link.options), {
    headers: {
      "content-type": "text/yaml; charset=utf-8",
      "cache-control": "no-store",
      "content-disposition": `inline; filename="${link.slug}.yaml"`,
    },
  });
}
