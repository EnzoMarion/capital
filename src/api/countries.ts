import { supabase } from "./supabase";

export type Country = {
    name: string;
    capital: string;
    code: string;
    continent: string;
    is_island: boolean;
    parent_code?: string;
    status: string;
};

export async function fetchCountries(): Promise<Country[]> {
    const { data, error } = await supabase.from("countries").select("*");
    console.log("data", data, "error", error);
    if (error) throw error;
    return (data as Country[]) || [];
}

