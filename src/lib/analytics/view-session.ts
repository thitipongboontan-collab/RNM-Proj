import { cookies } from "next/headers";

const VIEW_SESSION_COOKIE = "rnm_view_session";
const MAX_VIEW_KEYS = 200;

function parseViewKeys(raw: string | undefined): Set<string> {
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((key): key is string => typeof key === "string"));
  } catch {
    return new Set();
  }
}

async function getViewedKeys(): Promise<Set<string>> {
  const cookieStore = await cookies();
  return parseViewKeys(cookieStore.get(VIEW_SESSION_COOKIE)?.value);
}

async function saveViewedKeys(viewed: Set<string>): Promise<void> {
  const cookieStore = await cookies();
  const keys = Array.from(viewed);
  const trimmed = keys.length > MAX_VIEW_KEYS ? keys.slice(-MAX_VIEW_KEYS) : keys;

  cookieStore.set(VIEW_SESSION_COOKIE, encodeURIComponent(JSON.stringify(trimmed)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function countViewOnce(
  viewKey: string,
  increment: () => Promise<void>,
): Promise<boolean> {
  try {
    const viewed = await getViewedKeys();
    if (viewed.has(viewKey)) return false;

    await increment();

    viewed.add(viewKey);
    await saveViewedKeys(viewed);
    return true;
  } catch {
    await increment();
    return true;
  }
}
