// Server-side needs a full URL; browser can use a relative path
const isServer = typeof window === "undefined";
export const API_URL = isServer
  ? (process.env.SERVER_API_URL || "http://localhost:3001")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
