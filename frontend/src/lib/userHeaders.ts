const USERNAME = process.env.NEXT_PUBLIC_USER ?? "demo";
const ROLE = process.env.NEXT_PUBLIC_ROLE ?? "ADMIN";

export const USER_HEADERS: Record<string, string> = {
    "X-User": USERNAME,
    "X-Role": ROLE,
};

export type UserScope = "own" | "all";
