import { supabase } from "./supabase";

export async function signup(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
}
export async function login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
}
export async function getUser() {
    return supabase.auth.getUser();
}
export async function logout() {
    return supabase.auth.signOut();
}
