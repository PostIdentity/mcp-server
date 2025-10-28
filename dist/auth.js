import { createClient } from '@supabase/supabase-js';
// Export for use in tools
export const SUPABASE_URL = 'https://api.postidentity.com';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b25ucW1lcWd6bXVvd2hnbGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODgxNjYsImV4cCI6MjA2MDA2NDE2Nn0.Vj0WoFg_t3FDvgiq2aLQFJj9RcmAmlvJ1ibzzWYvifc';
let supabaseClient = null;
let userId = null;
let storedAccessToken = null;
export async function initializeClient(accessToken) {
    storedAccessToken = accessToken;
    // Create Supabase client WITHOUT global headers
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    // Parse the JWT to get user info
    // JWT structure: header.payload.signature (base64 encoded)
    // According to Supabase docs, 'sub' claim contains the user ID (UUID)
    const tokenParts = accessToken.split('.');
    if (tokenParts.length !== 3) {
        throw new Error('Invalid access token format - JWT must have 3 parts');
    }
    try {
        const payload = JSON.parse(atob(tokenParts[1]));
        // Extract user ID from 'sub' claim (standard JWT claim for subject/user ID)
        userId = payload.sub;
        console.error('✅ Authenticated successfully');
        console.error(`📧 Email: ${payload.email || 'N/A'}`);
        console.error(`🆔 User ID (from JWT 'sub' claim): ${userId}`);
        console.error(`🔑 Role: ${payload.role || 'N/A'}`);
        console.error(`⏰ Token expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'}`);
        if (!userId) {
            throw new Error('JWT payload missing required "sub" claim (user ID)');
        }
    }
    catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        throw new Error(`Failed to parse access token: ${errorMsg}`);
    }
    return supabaseClient;
}
export function getUserId() {
    if (!userId) {
        throw new Error('Not authenticated');
    }
    return userId;
}
export function getClient() {
    if (!supabaseClient) {
        throw new Error('Client not initialized');
    }
    return supabaseClient;
}
export function getAccessToken() {
    if (!storedAccessToken) {
        throw new Error('Not authenticated');
    }
    return storedAccessToken;
}
//# sourceMappingURL=auth.js.map