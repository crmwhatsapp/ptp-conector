/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/.well-known/oauth-authorization-server", destination: "/wkas" },
        { source: "/.well-known/oauth-protected-resource", destination: "/wkpr" },
      ],
    };
  },
};
module.exports = nextConfig;
