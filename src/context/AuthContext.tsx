import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import { AuthContext } from "./authContextValue";

export type AuthUser = {
    email: string;
    id: string;
    avatarUrl?: string | null;
} | null;

function avatarUrlFromMetadata(metadata: Record<string, unknown> | undefined) {
    const value = metadata?.avatar_url ?? metadata?.picture;
    return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let authEventReceived = false;
        const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
            authEventReceived = true;
            const email = session?.user?.email;
            const id = session?.user?.id;
            if (email && id) setUser({ email, id, avatarUrl: avatarUrlFromMetadata(session?.user?.user_metadata) });
            else setUser(null);
            setLoading(false);
        });
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) console.error("Impossible de récupérer la session.", error.message);
            if (!authEventReceived) {
                const email = data.session?.user.email;
                const id = data.session?.user.id;
                setUser(email && id ? { email, id, avatarUrl: avatarUrlFromMetadata(data.session?.user?.user_metadata) } : null);
                setLoading(false);
            }
        }).catch(() => setLoading(false));
        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);


    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
