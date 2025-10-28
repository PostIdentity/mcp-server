import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';
export async function getReferralStats() {
    try {
        const userId = getUserId();
        const accessToken = getAccessToken();
        // First get referral code
        const codeResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_preferences?user_id=eq.${userId}&select=referral_code`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!codeResponse.ok) {
            throw new Error(`HTTP ${codeResponse.status}`);
        }
        const codeData = await codeResponse.json();
        const referralCode = codeData[0]?.referral_code;
        if (!referralCode) {
            return '❌ You don\'t have a referral code yet. Visit https://postidentity.com/referrals to get started!';
        }
        // Get referral stats using RPC function
        const statsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_referral_stats`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_user_id: userId }),
        });
        if (!statsResponse.ok) {
            throw new Error(`HTTP ${statsResponse.status}`);
        }
        const stats = await statsResponse.json();
        let result = '🎁 **Referral Stats**\n\n';
        result += `📋 Your Code: **${referralCode}**\n`;
        result += `👥 Total Referrals: ${stats.total_referrals}\n`;
        result += `💰 Credits Earned: ${stats.credits_earned}\n\n`;
        if (stats.total_referrals === 0) {
            result += '💡 Share your code to earn 5 credits per referral!\n';
            result += 'Your friend gets 5 credits too! 🎉\n';
        }
        else {
            result += `🔗 Share at: https://postidentity.com/auth?ref=${referralCode}`;
        }
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to get referral stats: ${errorMessage}`);
    }
}
//# sourceMappingURL=get-referral-stats.js.map