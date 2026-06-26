import { signAuthCode, validarAcesso } from "../../lib/oauth";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPage(params: {
  client_id: string;
  redirect_uri: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  response_type: string;
  erro?: string;
}): string {
  const erroHtml = params.erro
    ? '<p class="erro">' + esc(params.erro) + "</p>"
    : "";
  return (
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Protocolo Terapeutico Premium</title><style>" +
    "*{box-sizing:border-box}body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;" +
    "background:#1a1014;color:#f3ece6;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}" +
    ".card{background:#241a1f;border:1px solid #5a3a48;border-radius:16px;max-width:420px;width:100%;padding:32px;" +
    "box-shadow:0 12px 40px rgba(0,0,0,.45)}h1{font-size:22px;margin:0 0 6px;color:#e9c98c}" +
    ".sub{font-size:14px;color:#c9b8ad;margin:0 0 24px}label{display:block;font-size:13px;margin-bottom:8px;color:#e9c98c}" +
    "input{width:100%;padding:14px;border-radius:10px;border:1px solid #5a3a48;background:#1a1014;color:#fff;" +
    "font-size:16px;letter-spacing:1px}button{width:100%;margin-top:20px;padding:14px;border:0;border-radius:10px;" +
    "background:#8c2f4a;color:#fff;font-size:16px;font-weight:600;cursor:pointer}button:hover{background:#a3375a}" +
    ".erro{background:#3a1a22;border:1px solid #8c2f4a;color:#ffb3c1;padding:12px;border-radius:10px;font-size:14px;margin-bottom:18px}" +
    ".rodape{margin-top:22px;font-size:12px;color:#8a7a70;text-align:center}</style></head><body>" +
    '<form class="card" method="POST" action="/authorize">' +
    "<h1>Protocolo Terapeutico Premium</h1>" +
    '<p class="sub">Cole o seu codigo de acesso para liberar o conector.</p>' +
    erroHtml +
    '<label for="codigo">Codigo de acesso</label>' +
    '<input id="codigo" name="codigo" type="text" autocomplete="off" autofocus required placeholder="Digite o seu codigo">' +
    '<input type="hidden" name="client_id" value="' + esc(params.client_id) + '">' +
    '<input type="hidden" name="redirect_uri" value="' + esc(params.redirect_uri) + '">' +
    '<input type="hidden" name="state" value="' + esc(params.state) + '">' +
    '<input type="hidden" name="code_challenge" value="' + esc(params.code_challenge) + '">' +
    '<input type="hidden" name="code_challenge_method" value="' + esc(params.code_challenge_method) + '">' +
    '<input type="hidden" name="response_type" value="' + esc(params.response_type) + '">' +
    "<button type=\"submit\">Liberar acesso</button>" +
    '<p class="rodape">Therapy Scale Academy</p>' +
    "</form></body></html>"
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const html = renderPage({
    client_id: q.get("client_id") || "",
    redirect_uri: q.get("redirect_uri") || "",
    state: q.get("state") || "",
    code_challenge: q.get("code_challenge") || "",
    code_challenge_method: q.get("code_challenge_method") || "S256",
    response_type: q.get("response_type") || "code",
  });
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const get = (k: string) => String(form.get(k) || "");
  const codigo = get("codigo").trim();
  const client_id = get("client_id");
  const redirect_uri = get("redirect_uri");
  const state = get("state");
  const code_challenge = get("code_challenge");
  const code_challenge_method = get("code_challenge_method") || "S256";
  const response_type = get("response_type") || "code";

  const reRender = (erro: string) =>
    new Response(
      renderPage({
        client_id,
        redirect_uri,
        state,
        code_challenge,
        code_challenge_method,
        response_type,
        erro,
      }),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
    );

  if (!codigo) return reRender("Informe o seu codigo de acesso.");
  if (!redirect_uri) return reRender("Requisicao invalida (redirect_uri ausente).");

  const r = await validarAcesso(codigo);
  if (!r.valido) {
    return reRender(r.mensagem || "Codigo invalido ou expirado.");
  }

  const code = await signAuthCode({
    code_challenge,
    redirect_uri,
    sub: r.nome || codigo,
  });

  const dest = new URL(redirect_uri);
  dest.searchParams.set("code", code);
  if (state) dest.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: { Location: dest.toString(), "Cache-Control": "no-store" },
  });
}
