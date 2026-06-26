import { SignJWT, jwtVerify } from "jose";

// Segredo de assinatura dos JWT (codigo de autorizacao e access token).
const secretRaw = process.env.OAUTH_SECRET || "dev-secret-troque-isto-por-32-chars-min-aaaa";
const secret = new TextEncoder().encode(secretRaw);

// Base URL publica (issuer). Em producao vem de PUBLIC_BASE_URL.
export function getBaseUrl(): string {
  const b = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
  return b.replace(/\/$/, "");
}

export interface AuthCodePayload {
  code_challenge: string;
  redirect_uri: string;
  sub: string;
}

// Assina um codigo de autorizacao (vale 5 minutos).
export async function signAuthCode(p: AuthCodePayload): Promise<string> {
  return new SignJWT({
    code_challenge: p.code_challenge,
    redirect_uri: p.redirect_uri,
    typ: "auth_code",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);
}

export async function verifyAuthCode(token: string): Promise<AuthCodePayload> {
  const { payload } = await jwtVerify(token, secret);
  if (payload.typ !== "auth_code") throw new Error("tipo de token invalido");
  return {
    code_challenge: String(payload.code_challenge),
    redirect_uri: String(payload.redirect_uri),
    sub: String(payload.sub),
  };
}

// Assina um access token (vale 30 dias).
export async function signAccessToken(sub: string): Promise<string> {
  return new SignJWT({ typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; exp?: number }> {
  const { payload } = await jwtVerify(token, secret);
  if (payload.typ !== "access") throw new Error("tipo de token invalido");
  return { sub: String(payload.sub), exp: payload.exp };
}

// Verificacao PKCE S256: base64url(sha256(code_verifier)) === code_challenge.
export async function verifyPkce(codeVerifier: string, codeChallenge: string): Promise<boolean> {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const b64url = Buffer.from(new Uint8Array(digest))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return b64url === codeChallenge;
}

// Valida o codigo de acesso na RPC do Supabase.
export async function validarAcesso(
  codigo: string
): Promise<{ valido: boolean; nome?: string; mensagem?: string }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    return { valido: false, mensagem: "Servidor sem configuracao do Supabase." };
  }
  try {
    const resp = await fetch(url + "/rest/v1/rpc/validar_acesso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({ p_codigo: codigo }),
    });
    const data = await resp.json();
    if (data && data.valido === true) {
      return { valido: true, nome: data.nome };
    }
    return { valido: false, mensagem: (data && data.mensagem) || "Codigo invalido." };
  } catch {
    return { valido: false, mensagem: "Falha ao validar o codigo. Tente novamente." };
  }
}
