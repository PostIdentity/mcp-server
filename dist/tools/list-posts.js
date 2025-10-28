import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';
export async function listPosts(profileId, limit = 10) {
    try {
        const userId = getUserId();
        const accessToken = getAccessToken();
        // Build query with optional profile filter
        let url = `${SUPABASE_URL}/rest/v1/posts?user_id=eq.${userId}&select=id,content,profile_id,original_prompt,created_at,profiles(name)&order=created_at.desc&limit=${limit}`;
        if (profileId) {
            url += `&profile_id=eq.${profileId}`;
        }
        const response = await fetch(url, {
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
            return 'No posts found. Generate your first post!';
        }
        let result = `Found ${data.length} post${data.length === 1 ? '' : 's'}:\n\n`;
        data.forEach((post, index) => {
            const date = new Date(post.created_at);
            const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            result += `${index + 1}. ${post.profiles?.name || 'Unknown Identity'} • ${dateStr}\n`;
            if (post.original_prompt) {
                result += `   💭 Thought: "${post.original_prompt.substring(0, 60)}${post.original_prompt.length > 60 ? '...' : ''}"\n`;
            }
            result += `   📝 Post: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"\n`;
            result += `   ID: ${post.id}\n\n`;
        });
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to list posts: ${errorMessage}`);
    }
}
//# sourceMappingURL=list-posts.js.map