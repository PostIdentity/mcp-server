import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

export async function archiveIdentity(identityId: string): Promise<string> {
  try {
    const userId = getUserId();
    const accessToken = getAccessToken();

    // First verify the identity belongs to the user
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
