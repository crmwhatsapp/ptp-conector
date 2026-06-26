import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const clientId = "ptp_" + randomBytes(16).toString("hex");
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
  const resp = {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code"],
    response_types: ["code"],
    redirect_uris: redirectUris,
    client_name: body.client_name || "Protocolo Terapeutico Premium",
  };
  return new Response(JSON.stringify(resp), {
    status: 201,
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
