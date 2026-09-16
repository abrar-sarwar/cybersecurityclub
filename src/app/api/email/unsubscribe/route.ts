import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/site";
import { hitIpRateLimit, LIMITS } from "@/server/rate-limit";
import { unsubscribeFromEventEmails } from "@/server/unsubscribe";

/** One-click unsubscribe (RFC 8058) posted by mail clients from the List-Unsubscribe header. */
export async function POST(request: NextRequest) {
  if (!(await hitIpRateLimit(LIMITS.unsubscribePerIp))) {
    return new NextResponse("Too many requests", { status: 429 });
  }
  const done = await unsubscribeFromEventEmails(request.nextUrl.searchParams.get("token"));
  return new NextResponse(done ? "Unsubscribed" : "Invalid link", { status: done ? 200 : 400 });
}

/** A plain visit never changes anything: it opens the confirmation page. */
export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  return NextResponse.redirect(absoluteUrl(`/unsubscribe?token=${encodeURIComponent(token)}`), 303);
}
