import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import { getUser } from "../api/auth";

export type AuthUser = {
    email: string;
    id: string;
} | null;

const AuthContext = createContext<{ user: AuthUser; setUser: (u: AuthUser) => void }>({ user: null, setUser: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser>(null);

    useEffect(() => {
        getUser().then(({ data }) => {
            if (data?.user) setUser({ email: data.user.email, id: data.user.id });
            else setUser(null);
        });
        const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
            if (session?.user) setUser({ email: session.user.email, id: session.user.id });
            else setUser(null);
        });
        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
