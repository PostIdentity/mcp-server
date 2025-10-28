import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

export async function listPosts(profileIdOrName?: string, limit: number = 10): Promise<string> {
  try {
    const userId = getUserId();
    const accessToken = getAccessToken();

    let resolvedProfileId: string | undefined = profileIdOrName;

    // If profileIdOrName is provided, check if it's a UUID or name
    if (profileIdOrName) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileIdOrName);
      
      // If not a UUID, treat it as a name and look it up
      if (!isUUID) {
        const lookupResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&name=ilike.${encodeURIComponent(profileIdOrName)}&status=eq.active&select=id,name`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        
        if (!lookupResponse.ok) {
          throw new Error(`Failed to lookup identity: HTTP ${lookupResponse.status}`);
        }
        
        const lookupProfiles = await lookupResponse.json() as Array<{ id: string; name: string }>;
        
        if (!lookupProfiles || lookupProfiles.length === 0) {
          return `❌ Identity "${profileIdOrName}" not found.\n\nTip: Use list_identities to see your available identities.`;
        }
        
        if (lookupProfiles.length > 1) {
          return `❌ Multiple identities found with name "${profileIdOrName}".\n\nPlease use the identity UUID instead. Use list_identities to see all identities with their IDs.`;
        }
        
        resolvedProfileId = lookupProfiles[0].id;
      }
    }

    // Build query with optional profile filter
    let url = `${SUPABASE_URL}/rest/v1/posts?user_id=eq.${userId}&select=id,content,profile_id,original_prompt,created_at,profiles(name)&order=created_at.desc&limit=${limit}`;
    
    if (resolvedProfileId) {
      url += `&profile_id=eq.${resolvedProfileId}`;
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

    const data = await response.json() as Array<{
      id: string;
      content: string;
      profile_id: string;
      original_prompt: string | null;
      created_at: string;
      profiles: { name: string } | null;
    }>;

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to list posts: ${errorMessage}`);
  }
}
