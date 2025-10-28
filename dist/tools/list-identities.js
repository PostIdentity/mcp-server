import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';
export async function listIdentities() {
    try {
        const userId = getUserId();
        const accessToken = getAccessToken();
        // Make direct fetch call with auth header for RLS
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&archived_at=is.null&select=id,name,description,created_at&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!data || data.length === 0) {
            return 'No identities found. Create your first identity at https://postidentity.com/create-profile';
        }
        const identities = data;
        let result = `Found ${identities.length} identit${identities.length === 1 ? 'y' : 'ies'}:\n\n`;
        identities.forEach((identity, index) => {
            result += `${index + 1}. ${identity.name}\n`;
            result += `   ID: ${identity.id}\n`;
            if (identity.description) {
                result += `   Description: ${identity.description.substring(0, 100)}${identity.description.length > 100 ? '...' : ''}\n`;
            }
            result += '\n';
        });
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to list identities: ${errorMessage}`);
    }
}
//# sourceMappingURL=list-identities.js.map