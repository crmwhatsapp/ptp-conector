import { verifyAuthCode, verifyPkce, signAccessToken } from "../../lib/oauth";

export const dynamic = "force-dynamic";

function jsonErr(error: string, desc: string, status = 400) {
  return new Response(JSON.stringify({ error, error_description: desc }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  // Aceita form-urlencoded (padrao OAuth) ou JSON.
  let params: Record<string, string> = {};
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      params = await req.json();
    } catch {
      params = {};
    }
  } else {
    const form = await req.formData();
    form.forEach((v, k) => (params[k] = String(v)));
  }

  const grant_type = params.grant_type;
  const code = params.code;
  const code_verifier = params.code_verifier;
  const redirect_uri = params.redirect_uri;

  if (grant_type !== "authorization_code") {
    return jsonErr("unsupported_grant_type", "Apenas authorization_code e suportado.");
  }
  if (!code) return jsonErr("invalid_request", "code ausente.");
  if (!code_verifier) return jsonErr("invalid_request", "code_verifier ausente.");

  let payload;
  try {
    payload = await verifyAuthCode(code);
  } catch {
    return jsonErr("invalid_grant", "Codigo de autorizacao invalido ou expirado.");
  }

  if (redirect_uri && redirect_uri !== payload.redirect_uri) {
    return jsonErr("invalid_grant", "redirect_uri nao confere.");
  }

  const pkceOk = await verifyPkce(code_verifier, payload.code_challenge);
  if (!pkceOk) {
    return jsonErr("invalid_grant", "Falha na verificacao PKCE.");
  }

  const access_token = await signAccessToken(payload.sub);
  const resp = {
    access_token,
    token_type: "Bearer",
    expires_in: 2592000,
    scope: "mcp",
  };
  return new Response(JSON.stringify(resp), {
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
