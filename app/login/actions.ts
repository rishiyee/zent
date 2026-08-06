"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AUTH_METHOD_COOKIE } from "@/lib/auth-method"
import { createClient } from "@/lib/supabase/server"

export type AuthFormState = { error: string } | undefined

const AUTH_METHOD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const cookieStore = await cookies()
  cookieStore.set(AUTH_METHOD_COOKIE, "email", {
    path: "/",
    maxAge: AUTH_METHOD_COOKIE_MAX_AGE,
    sameSite: "lax",
  })

  redirect("/")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
