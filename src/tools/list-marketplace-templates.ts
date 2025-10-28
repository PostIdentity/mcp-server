import { getAccessToken, SUPABASE_URL, SUPABASE_ANON_KEY } from '../auth.js';

export async function listMarketplaceTemplates(category?: string): Promise<string> {
  try {
    const accessToken = getAccessToken();

    // Build query with optional category filter
    let url = `${SUPABASE_URL}/rest/v1/identity_templates?active=eq.true&select=id,name,description,category,credits,features,purchases,trending&order=purchases.desc`;
    
    if (category) {
      url += `&category=eq.${category}`;
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
      name: string;
      description: string;
      category: string;
      credits: number;
      features: string[];
      purchases: number;
      trending: boolean;
    }>;

    if (!data || data.length === 0) {
      return 'No templates found in the marketplace.';
    }

    let result = `Found ${data.length} template${data.length === 1 ? '' : 's'}`;
    if (category) {
      result += ` in **${category}** category`;
    }
    result += ':\n\n';

    data.forEach((template, index) => {
      const badges: string[] = [];
      if (template.trending) badges.push('🔥 Trending');
      if (template.purchases > 50) badges.push('⭐ Popular');
      
      result += `${index + 1}. **${template.name}**`;
      if (badges.length > 0) {
        result += ` (${badges.join(', ')})`;
      }
      result += '\n';
      
      result += `   💰 Price: ${template.credits} credits\n`;
      result += `   📂 Category: ${template.category}\n`;
      result += `   📝 ${template.description.substring(0, 80)}${template.description.length > 80 ? '...' : ''}\n`;
      
      if (template.features && template.features.length > 0) {
        result += `   ✨ Features: ${template.features.slice(0, 2).join(', ')}`;
        if (template.features.length > 2) {
          result += ` +${template.features.length - 2} more`;
        }
        result += '\n';
      }
      
      result += `   📊 ${template.purchases} purchases\n`;
      result += `   🆔 ID: ${template.id}\n\n`;
    });

    result += `\n💡 Visit https://postidentity.com/marketplace to purchase templates`;

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to list marketplace templates: ${errorMessage}`);
  }
}
