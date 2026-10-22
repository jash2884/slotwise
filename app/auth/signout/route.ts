import { clearedSessionCookie, safeReturnPath } from "../../auth";

async function signOut(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return new Response(null, {
    status: request.method === "POST" ? 303 : 302,
    headers: {
      Location: safeReturnPath(url.searchParams.get("return_to")),
      "Set-Cookie": clearedSessionCookie(url.protocol === "https:"),
      "Cache-Control": "private, no-store",
    },
  });
}

export const GET = signOut;
export const POST = signOut;
