import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';
export async function getCredits() {
    try {
        const userId = getUserId();
        const accessToken = getAccessToken();
        // Make direct fetch call with auth header for RLS
        const response = await fetch(`${SUPABASE_URL}/rest/v1/user_preferences?user_id=eq.${userId}&select=credits`, {
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
            return 'Could not retrieve credits';
        }
        const credits = data[0].credits || 0;
        let output = `💳 Current Balance: ${credits} credit${credits === 1 ? '' : 's'}\n\n`;
        if (credits === 0) {
            output += '⚠️  You have no credits remaining.\n';
            output += 'Buy more at: https://postidentity.com/credits\n';
        }
        else if (credits < 5) {
            output += '⚠️  Low balance! Consider buying more credits.\n';
            output += 'Buy credits at: https://postidentity.com/credits\n';
        }
        else {
            output += `✅ You can generate ${credits} more post${credits === 1 ? '' : 's'}\n`;
        }
        return output;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to get credits: ${errorMessage}`);
    }
}
//# sourceMappingURL=get-credits.js.map