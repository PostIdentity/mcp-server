import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

export async function generatePost(
  identityId: string,
  thoughtContent: string
): Promise<string> {
  try {
    const userId = getUserId();
    const accessToken = getAccessToken();

    // First, fetch the profile data from the database
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
