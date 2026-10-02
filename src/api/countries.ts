import { supabase } from "./supabase";
import { fetchCachedPublicData } from "./publicDataCache";

export type Country = {
    name: string;
    capital: string;
    code: string;
    capital_variants?: string[];
    continent: string;
    is_island: boolean;
    parent_code?: string;
    status: string;
    ue_date: string;
};

export async function fetchCountries(selectedContinents?: string[]) {
    const countries = await fetchCachedPublicData<Country>("countries", async () => {
        const { data, error } = await supabase
            .from("countries")
            .select("name,capital,code,continent,is_island,parent_code,status,ue_date");
        if (error) throw error;
        return (data ?? []) as Country[];
    });
    if (!selectedContinents?.length) return countries;
    const continents = new Set(selectedContinents);
    return countries.filter(country => continents.has(country.continent));
}

