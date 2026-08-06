import { createClient } from "@/lib/supabase/server"
import { Goal } from "@/lib/goals"

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("goals")
    .select("id, name")
    .order("created_at", { ascending: true })

  if (error) throw error
  return data as Goal[]
}
