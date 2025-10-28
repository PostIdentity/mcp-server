import { SupabaseClient } from '@supabase/supabase-js';
export declare const SUPABASE_URL = "https://api.postidentity.com";
export declare const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b25ucW1lcWd6bXVvd2hnbGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODgxNjYsImV4cCI6MjA2MDA2NDE2Nn0.Vj0WoFg_t3FDvgiq2aLQFJj9RcmAmlvJ1ibzzWYvifc";
export declare function initializeClient(accessToken: string): Promise<SupabaseClient>;
export declare function getUserId(): string;
export declare function getClient(): SupabaseClient;
export declare function getAccessToken(): string;
//# sourceMappingURL=auth.d.ts.map