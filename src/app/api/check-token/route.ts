import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

// Create a Convex client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Define token status type
interface TokenStatus {
  valid: boolean;
  reason?: string;
  expiresIn?: number;
  notActivated?: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const activate = searchParams.get("activate") === "true";

  if (!token) {
    return NextResponse.json(
      { valid: false, reason: "No token provided" },
      { status: 400 }
    );
  }

  try {
    if (activate) {
      // Activate the token (starts the countdown)
      // @ts-expect-error Using string literal for Convex mutation name
      const tokenStatus = await convex.mutation<TokenStatus>("tokens:activateToken", { token });
      return NextResponse.json(tokenStatus);
    } else {
      // Just check the token status without activating
      // @ts-expect-error Using string literal for Convex query name
      const tokenStatus = await convex.query<TokenStatus>("tokens:checkToken", { token });
      return NextResponse.json(tokenStatus);
    }
  } catch (error) {
    console.error("Error checking token:", error);
    return NextResponse.json(
      { valid: false, reason: "Error checking token" },
      { status: 500 }
    );
  }
} 