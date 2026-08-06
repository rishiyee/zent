"use server"

import { revalidatePath } from "next/cache"

import { CategoryType } from "@/lib/categories"
import { createClient } from "@/lib/supabase/server"

function revalidateCategories() {
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/")
}

function friendlyError(error: { code?: string; message: string }, duplicateMessage: string) {
  if (error.code === "23505") return new Error(duplicateMessage)
  return error
}

export async function addCategoryGroup(type: CategoryType, name: string) {
  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from("category_groups")
    .select("id", { count: "exact", head: true })
    .eq("type", type)
  if (countError) throw countError

  const { error } = await supabase
    .from("category_groups")
    .insert({ type, name, sort_order: count ?? 0 })
  if (error) throw friendlyError(error, `A group named "${name}" already exists.`)
  revalidateCategories()
}

export async function renameCategoryGroup(groupId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("category_groups")
    .update({ name })
    .eq("id", groupId)
  if (error) throw friendlyError(error, `A group named "${name}" already exists.`)
  revalidateCategories()
}

export async function deleteCategoryGroup(groupId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("category_groups").delete().eq("id", groupId)
  if (error) throw error
  revalidateCategories()
}

export async function addCategory(groupId: string, name: string, icon: string) {
  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
  if (countError) throw countError

  const { error } = await supabase
    .from("categories")
    .insert({ group_id: groupId, name, icon, sort_order: count ?? 0 })
  if (error) throw friendlyError(error, `"${name}" already exists in this group.`)
  revalidateCategories()
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("categories").delete().eq("id", categoryId)
  if (error) throw error
  revalidateCategories()
}

export async function moveCategory(
  categoryId: string,
  toGroupId: string,
  toIndex: number
) {
  const supabase = await createClient()
  const { data: siblings, error: fetchError } = await supabase
    .from("categories")
    .select("id")
    .eq("group_id", toGroupId)
    .neq("id", categoryId)
    .order("sort_order", { ascending: true })
  if (fetchError) throw fetchError

  const orderedIds = (siblings ?? []).map((row) => row.id)
  orderedIds.splice(Math.min(toIndex, orderedIds.length), 0, categoryId)

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("categories")
      .update({ group_id: toGroupId, sort_order: index })
      .eq("id", id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) {
    throw friendlyError(
      failed.error,
      "A category with that name already exists in this group."
    )
  }

  revalidateCategories()
}
