const ENV_BASE =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE)
        ? process.env.NEXT_PUBLIC_API_BASE
        : undefined;

const FALLBACK_BASE =
    (typeof window !== "undefined" && window.location?.hostname)
        ? `http://${window.location.hostname}:43261`
        : "http://localhost:43261";

const RAW_BASE = ENV_BASE ?? FALLBACK_BASE;

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

export default API_BASE;
