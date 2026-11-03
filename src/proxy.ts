import { Result } from "neverthrow";
import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const encodedSlug = request.nextUrl.pathname.split("/")[2] ?? "";
  const decodedSlug = Result.fromThrowable(decodeURIComponent)(encodedSlug);
  if (decodedSlug.isErr()) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), {
      status: 404,
    });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/seasonal/:slug", "/journal/:slug"] };
