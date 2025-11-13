export type Quiz = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    created_at: string;
    settings: Record<string, any>;
    public: boolean;
};
