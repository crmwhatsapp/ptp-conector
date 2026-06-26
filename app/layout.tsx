export const metadata = {
  title: "Protocolo Terapeutico Premium",
  description: "Conector MCP do Protocolo Terapeutico Premium.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
