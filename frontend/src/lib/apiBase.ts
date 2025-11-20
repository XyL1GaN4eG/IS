const RAW_BASE =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE)
        ? process.env.NEXT_PUBLIC_API_BASE
        : "http://localhost:43261";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

export default API_BASE;
