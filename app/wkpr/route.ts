import { getBaseUrl } from "../../lib/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = getBaseUrl();
  const metadata = {
    resource: base,
    authorization_servers: [base],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp"],
  };
  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
