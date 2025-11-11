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

export async function fetchCountries(selectedContinents?: string[]) {
    let query = supabase.from("countries").select("*");
    if (selectedContinents && selectedContinents.length > 0) {
        query = query.in("continent", selectedContinents);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as Country[]) || [];
}

