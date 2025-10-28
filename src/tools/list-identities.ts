import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

export async function listIdentities(status: 'active' | 'archived' | 'all' = 'active'): Promise<string> {
  try {
    const userId = getUserId();
    const accessToken = getAccessToken();

    // Build filter based on status
    let filter = `user_id=eq.${userId}`;
    if (status === 'active') {
      filter += '&archived_at=is.null';
    } else if (status === 'archived') {
      filter += '&archived_at=not.is.null';
    }
    // 'all' = no archived_at filter

    // Make direct fetch call with auth header for RLS
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?${filter}&select=id,name,description,created_at,archived_at&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json() as Array<{ id: string; name: string; description: string | null; created_at: string; archived_at: string | null }>;

    if (!data || data.length === 0) {
      const statusText = status === 'archived' ? 'archived identities' : status === 'all' ? 'identities' : 'active identities';
      return `No ${statusText} found. Create your first identity at https://postidentity.com/create-profile`;
    }

    const identities = data;
    
    const statusText = status === 'active' ? 'active' : status === 'archived' ? 'archived' : '';
    let result = `Found ${identities.length} ${statusText ? statusText + ' ' : ''}identit${identities.length === 1 ? 'y' : 'ies'}:\n\n`;
    
    identities.forEach((identity, index) => {
      result += `${index + 1}. ${identity.name}`;
      if (identity.archived_at) {
        result += ' (Archived)';
      }
      result += '\n';
      result += `   ID: ${identity.id}\n`;
      if (identity.description) {
        result += `   Description: ${identity.description.substring(0, 100)}${identity.description.length > 100 ? '...' : ''}\n`;
      }
      result += '\n';
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to list identities: ${errorMessage}`);
  }
}
