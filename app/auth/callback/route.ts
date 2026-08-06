import { NextResponse, type NextRequest } from "next/server"

import { AUTH_METHOD_COOKIE, isAuthMethod } from "@/lib/auth-method"
import { createClient } from "@/lib/supabase/server"

const AUTH_METHOD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const provider = searchParams.get("provider")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(`${origin}/`)
      if (isAuthMethod(provider)) {
        response.cookies.set(AUTH_METHOD_COOKIE, provider, {
          path: "/",
          maxAge: AUTH_METHOD_COOKIE_MAX_AGE,
          sameSite: "lax",
        })
      }
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
