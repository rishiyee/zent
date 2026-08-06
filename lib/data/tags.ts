import { createClient } from "@/lib/supabase/server"
import { Tag } from "@/lib/tags"

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tags")
    .select("id, label, color")
    .order("created_at", { ascending: true })

  if (error) throw error
  return data as Tag[]
}
