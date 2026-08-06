"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { AuthFormState } from "@/app/login/actions"

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/login")
}
