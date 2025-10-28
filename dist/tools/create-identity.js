import { getUserId, getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';
export async function createIdentity(name, description, examples) {
    try {
        const userId = getUserId();
        const accessToken = getAccessToken();
        // Validate inputs
        if (!name || name.trim().length === 0) {
            return '❌ Identity name is required.';
        }
        if (!description || description.trim().length === 0) {
            return '❌ Description is required.';
        }
        if (!examples || examples.length < 3) {
            return '❌ At least 3 example posts are required. More examples improve accuracy!';
        }
        // Call generate-profile edge function to create the json_config
        const generateResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-profile`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: description.trim(),
                examples: examples.map(ex => ex.trim()),
            }),
        });
        if (!generateResponse.ok) {
            const errorData = await generateResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${generateResponse.status}`);
        }
        const profileData = await generateResponse.json();
        // Create the profile in the database
        const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify({
                user_id: userId,
                name: name.trim(),
                description: description.trim(),
                json_config: profileData,
                status: 'active',
            }),
        });
        if (!createResponse.ok) {
            throw new Error(`HTTP ${createResponse.status}`);
        }
        const createdProfile = await createResponse.json();
        if (!createdProfile || createdProfile.length === 0) {
            throw new Error('Profile created but no data returned');
        }
        const profile = createdProfile[0];
        let result = '✅ Identity created successfully!\n\n';
        result += `📝 Name: ${profile.name}\n`;
        result += `🆔 ID: ${profile.id}\n\n`;
        result += `💡 You can now generate posts with this identity using:\n`;
        result += `generate_post(identity_id="${profile.id}", thought_content="your thought")`;
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to create identity: ${errorMessage}`);
    }
}
//# sourceMappingURL=create-identity.js.map