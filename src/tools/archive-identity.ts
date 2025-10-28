import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

export async function archiveIdentity(identityIdOrName: string): Promise<string> {
  try {
    const userId = getUserId();
    const accessToken = getAccessToken();

    // Check if the input is a UUID (36 chars with dashes in specific positions)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identityIdOrName);
    
    let identityId = identityIdOrName;
    
    // If not a UUID, treat it as a name and look it up
    if (!isUUID) {
      const lookupResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&name=ilike.${encodeURIComponent(identityIdOrName)}&archived_at=is.null&select=id,name`,
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
        return `❌ Identity "${identityIdOrName}" not found.\n\nTip: Use list_identities to see your available identities.`;
      }
      
      if (lookupProfiles.length > 1) {
        return `❌ Multiple identities found with name "${identityIdOrName}".\n\nPlease use the identity UUID instead. Use list_identities to see all identities with their IDs.`;
      }
      
      identityId = lookupProfiles[0].id;
    }

    // Verify the identity belongs to the user using the resolved UUID
    const verifyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${identityId}&user_id=eq.${userId}&select=name`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      throw new Error(`HTTP ${verifyResponse.status}`);
    }

    const profiles = await verifyResponse.json() as Array<{ name: string }>;

    if (!profiles || profiles.length === 0) {
      return '❌ Identity not found or you do not have access to it.';
    }

    const identityName = profiles[0].name;

    // Archive the identity (soft delete)
    const archiveResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${identityId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          archived_at: new Date().toISOString(),
          status: 'archived',
        }),
      }
    );

    if (!archiveResponse.ok) {
      throw new Error(`HTTP ${archiveResponse.status}`);
    }

    return `✅ Identity "${identityName}" has been archived successfully.\n\n💡 You can restore it from Settings > Archived Identities if needed.`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete identity: ${errorMessage}`);
  }
}
