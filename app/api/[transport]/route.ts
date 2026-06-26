import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { verifyAccessToken } from "../../../lib/oauth";
import { FCI_SKILL, METODO_PREMIUM_SKILL } from "../../../lib/skills";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "usar_fci",
      {
        title: "Skill FCI (Fotografia do Cliente Ideal)",
        description:
          "Ativa a skill FCI (Fotografia do Cliente Ideal) da Metodologia Therapy Scale e devolve as instrucoes completas para conduzir o mapeamento de persona.",
        inputSchema: {},
      },
      async () => ({
        content: [{ type: "text", text: FCI_SKILL }],
      })
    );

    server.registerTool(
      "usar_metodo_premium",
      {
        title: "Skill Metodo Premium",
        description:
          "Ativa a skill Metodo Premium (Metodo Raiz + Protocolo Premium) e devolve as instrucoes completas para conduzir a Etapa 3.",
        inputSchema: {},
      },
      async () => ({
        content: [{ type: "text", text: METODO_PREMIUM_SKILL }],
      })
    );

    server.registerTool(
      "listar_skills",
      {
        title: "Listar skills disponiveis",
        description:
          "Lista as skills disponiveis neste conector do Protocolo Terapeutico Premium.",
        inputSchema: {},
      },
      async () => ({
        content: [
          {
            type: "text",
            text:
              "Skills disponiveis neste conector:\n" +
              "1. usar_fci, FCI (Fotografia do Cliente Ideal): mapeamento completo de persona.\n" +
              "2. usar_metodo_premium, Metodo Premium (Metodo Raiz + Protocolo Premium): conducao da Etapa 3.",
          },
        ],
      })
    );
  },
  {
    serverInfo: { name: "protocolo-terapeutico-premium", version: "1.0.0" },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  }
);

// Verifica o Bearer access token (JWT) emitido pelo nosso /token.
async function verifyToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  try {
    const { sub, exp } = await verifyAccessToken(bearerToken);
    return {
      token: bearerToken,
      clientId: sub,
      scopes: ["mcp"],
      expiresAt: exp,
    };
  } catch {
    return undefined;
  }
}

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
