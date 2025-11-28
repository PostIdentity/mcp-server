import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

interface GenerateReplyResult {
  postId: string;
  generatedReply: string;
  remainingCredits: number;
  isFreeRefinement?: boolean;
}

export async function generateReply(
  identityIdOrName: string,
  originalPost: string,
  replyDirection: string,
  characterLimit: number = 280
): Promise<string> {
  try {
    const userId = getUserId();
    const accessToken = getAccessToken();

    // Check if the input is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identityIdOrName);
    
    let identityId = identityIdOrName;
    
    // If not a UUID, treat it as a name and look it up
    if (!isUUID) {
      const lookupResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&name=ilike.${encodeURIComponent(identityIdOrName)}&status=eq.active&select=id,name`,
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

    // Fetch the profile data
    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${identityId}&user_id=eq.${userId}&select=id,json_config`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profile: HTTP ${profileResponse.status}`);
    }

    const profiles = await profileResponse.json() as Array<{ id: string; json_config: any }>;
    
    if (!profiles || profiles.length === 0) {
      throw new Error('Profile not found or you do not have access to it');
    }

    const profile = profiles[0];

    // Call the edge function with reply mode
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-post`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thoughtContent: replyDirection,
          profileJson: profile.json_config,
          profileId: profile.id,
          characterLimit,
          mode: 'reply',
          replyConfig: {
            originalPost,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string; code?: string };
      
      if (response.status === 402 || errorData.code === 'INSUFFICIENT_CREDITS') {
        return '❌ Insufficient credits! You need at least 1 credit to generate a reply.\n\nBuy credits at: https://postidentity.com/credits';
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json() as GenerateReplyResult;

    if (!result.generatedReply) {
      throw new Error('No reply generated');
    }

    // Format output
    let output = '✅ Reply generated successfully!\n\n';
    output += '📩 **Original post:**\n';
    output += originalPost.substring(0, 200) + (originalPost.length > 200 ? '...' : '') + '\n\n';
    output += '💬 **Your reply:**\n';
    output += '─'.repeat(50) + '\n';
    output += result.generatedReply + '\n';
    output += '─'.repeat(50) + '\n\n';
    output += `💳 Remaining credits: ${result.remainingCredits}\n`;
    if (result.postId) {
      output += `🆔 Reply ID: ${result.postId}\n`;
    }

    return output;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate reply: ${errorMessage}`);
  }
}
