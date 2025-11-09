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

export async function fetchCountries(continent?: string) {
    let query = supabase.from("countries").select("*");
    if (continent) {
        query = query.eq("continent", continent);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

