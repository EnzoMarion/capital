import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../api/supabase";

export type AuthUser = {
    email: string;
    id: string;
} | null;

type AuthContextValue = { user: AuthUser; setUser: (u: AuthUser) => void; loading: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, setUser: () => {}, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let authEventReceived = false;
        const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
            authEventReceived = true;
            const email = session?.user?.email;
            const id = session?.user?.id;
            if (email && id) setUser({ email, id });
            else setUser(null);
            setLoading(false);
        });
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) console.error("Impossible de récupérer la session.", error.message);
            if (!authEventReceived) {
                const email = data.session?.user.email;
                const id = data.session?.user.id;
                setUser(email && id ? { email, id } : null);
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

export function useAuth() {
    return useContext(AuthContext);
}
