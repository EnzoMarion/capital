import { supabase } from "./supabase";

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

const countryRequests = new Map<string, Promise<Country[]>>();

export function fetchCountries(selectedContinents?: string[]) {
    const continents = selectedContinents?.length ? [...selectedContinents].sort() : [];
    const key = continents.join("\u0000");
    const cached = countryRequests.get(key);
    if (cached) return cached;

    let query = supabase.from("countries").select("*");
    if (continents.length > 0) query = query.in("continent", continents);

    const request = Promise.resolve(query).then(({ data, error }) => {
        if (error) throw error;
        return (data as Country[]) || [];
    });
    countryRequests.set(key, request);
    void request.catch(() => countryRequests.delete(key));
    return request;
}

