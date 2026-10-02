import { supabase } from "./supabase";
import { fetchCachedPublicData } from "./publicDataCache";

export type FranceDepartmentRow = {
    id: number;
    code: string;
    nom: string;
    cheflieu: string;
    region: string | null;
};

export function fetchFranceDepartments() {
    return fetchCachedPublicData<FranceDepartmentRow>("fr-departments", async () => {
        const { data, error } = await supabase
            .from("fr_departements")
            .select("id,code,nom,cheflieu,region")
            .order("code");
        if (error) throw error;
        return (data ?? []) as FranceDepartmentRow[];
    });
}
