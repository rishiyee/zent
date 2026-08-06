"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export async function updateProfile(patch: {
  fullName: string
  birthday: string | null
  timezone: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: patch.fullName,
      birthday: patch.birthday,
      timezone: patch.timezone,
    },
  })
  if (error) throw error
  revalidatePath("/settings")
  revalidatePath("/")
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  })
  if (error) throw error
  revalidatePath("/settings")
  revalidatePath("/")
}

export async function updateDisplayPreferences(patch: {
  currency: string
  region: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { currency: patch.currency, region: patch.region },
  })
  if (error) throw error
  revalidatePath("/", "layout")
}
