import { supabase } from "./supabase";

export async function getFundraiserSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Unable to load fundraiser settings: ${error.message}`);
  }

  return data;
}