import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

type StyleAdjustment = 'more_casual' | 'more_formal' | 'add_humor' | 'more_serious' | 'more_direct' | 'add_emojis';
type RefinementType = 'regenerate' | 'shorter' | 'longer' | 'style_adjust' | 'refine';

interface RefinementOptions {
  type: RefinementType;
  sessionId: string;
  previousPost?: string;
  styleAdjustment?: StyleAdjustment;
  customFeedback?: string;
}

export async function generatePost(
  identityIdOrName: string,
  thoughtContent: string,
  characterLimit?: number,
  refinement?: RefinementOptions
): Promise<string> {
  try {
    const userId = getUserId();
    const accessToken = getAccessToken();

    // Check if the input is a UUID (36 chars with dashes in specific positions)
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

    // Fetch the profile data from the database using the resolved UUID
    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${identityId}&user_id=eq.${userId}&select=json_config`,
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

    const profiles = await profileResponse.json() as Array<{ json_config: any }>;
    
    if (!profiles || profiles.length === 0) {
      throw new Error('Profile not found or you do not have access to it');
    }

    const profileJson = profiles[0].json_config;

    // Call the edge function with the correct parameters
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-post`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thoughtContent,
          profileJson,
          characterLimit: characterLimit || null,
          iteration: refinement ? {
            type: refinement.type,
            sessionId: refinement.sessionId,
            // NOTE: freeRefinementsUsed removed - server verifies from database instead
            ...(refinement.previousPost && { previousPost: refinement.previousPost }),
            ...(refinement.styleAdjustment && { styleAdjustment: refinement.styleAdjustment }),
            ...(refinement.customFeedback && { customFeedback: refinement.customFeedback }),
          } : undefined,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string; code?: string };
      
      if (response.status === 402 || errorData.code === 'INSUFFICIENT_CREDITS') {
        return '❌ Insufficient credits! You need at least 1 credit to generate a post.\n\nBuy credits at: https://postidentity.com/credits';
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json() as { generatedPost: string; remainingCredits: number };

    if (!result.generatedPost) {
      throw new Error('No post generated');
    }

    // Generate session ID if this is a new post (not a refinement)
    const sessionId = refinement?.sessionId || `mcp_${identityId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the generated post to the database
    const saveResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/posts`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          profile_id: identityId,
          content: result.generatedPost,
          original_prompt: thoughtContent,
          status: 'published',
          session_id: sessionId  // SECURITY: Required for server-side refinement verification
        }),
      }
    );

    if (!saveResponse.ok) {
      // Log error but don't fail - post was already generated and credit deducted
      console.error(`Warning: Failed to save post to database: HTTP ${saveResponse.status}`);
      console.error(await saveResponse.text().catch(() => 'Could not read error'));
    }

    let output = '✅ Post generated successfully!\n\n';
    output += '─'.repeat(50) + '\n';
    output += result.generatedPost + '\n';
    output += '─'.repeat(50) + '\n\n';
    output += `💳 Remaining credits: ${result.remainingCredits}\n`;

    return output;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate post: ${errorMessage}`);
  }
}
