import { createSessionToken, safeReturnPath, sessionCookie, sessionsConfigured } from "../../auth";

// One-click guest sign-in: every visitor gets a private, randomly generated identity.
async function signInAsGuest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return new Response("Cross-site sign-in is not allowed.", { status: 403 });
  }
  if (!sessionsConfigured()) {
    return new Response("Sign-in is not configured on this deployment.", { status: 503 });
  }
  const uid = `guest_${crypto.randomUUID()}`;
  const name = `Guest ${uid.slice(-4).toUpperCase()}`;
  const token = await createSessionToken(uid, name);
  return new Response(null, {
    status: request.method === "POST" ? 303 : 302,
    headers: {
      Location: safeReturnPath(url.searchParams.get("return_to")),
      "Set-Cookie": sessionCookie(token, url.protocol === "https:"),
      "Cache-Control": "private, no-store",
    },
  });
}

export const GET = signInAsGuest;
export const POST = signInAsGuest;
