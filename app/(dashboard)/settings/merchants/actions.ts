"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export async function renameMerchant(oldName: string, newName: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("transactions")
    .update({ description: newName })
    .eq("description", oldName)
  if (error) throw error

  revalidatePath("/settings/merchants")
  revalidatePath("/transactions")
  revalidatePath("/")
}
