import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export const LEADERBOARD_SIZE = 20;

export type SpendingEntry = {
  player_id: string;
  display_name: string;
  total_spent: number;
};

const UNEXPECTED_RESPONSE = "Не удалось загрузить таблицу лидеров.";

function isSpendingEntry(value: unknown): value is SpendingEntry {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.player_id === "string" &&
    typeof row.display_name === "string" &&
    typeof row.total_spent === "number"
  );
}

export async function fetchTopSpenders(): Promise<SpendingEntry[]> {
  const { data, error } = await supabase
    .from("player_spending")
    .select("player_id, display_name, total_spent")
    .order("total_spent", { ascending: false })
    .limit(LEADERBOARD_SIZE);
  if (error) throw new Error(UNEXPECTED_RESPONSE);
  if (!Array.isArray(data) || !data.every(isSpendingEntry)) throw new Error(UNEXPECTED_RESPONSE);
  return data;
}

export function subscribeToSpending(onChange: () => void): RealtimeChannel {
  return supabase
    .channel("player-spending")
    .on("postgres_changes", { event: "*", schema: "public", table: "player_spending" }, onChange)
    .subscribe();
}
