import { Result } from "neverthrow";
import { type NextRequest, NextResponse } from "next/server";
import { seasonalEntryExists } from "@/services/seasonal";

export async function proxy(request: NextRequest) {
  const encodedSlug = request.nextUrl.pathname.split("/")[2] ?? "";
  const slug =
    Result.fromThrowable(decodeURIComponent)(encodedSlug).unwrapOr("");
  // Check before the shared loading boundary sends HTTP 200.
  const result = await seasonalEntryExists(slug);
  // Let the page's normal error boundary handle provider failures.
  if (result.isErr() || result.value) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_not-found", request.url), {
    status: 404,
  });
}

export const config = { matcher: "/seasonal/:slug" };
