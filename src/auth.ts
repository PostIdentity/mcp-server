import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Export for use in tools
export const SUPABASE_URL = 'https://api.postidentity.com';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b25ucW1lcWd6bXVvd2hnbGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODgxNjYsImV4cCI6MjA2MDA2NDE2Nn0.Vj0WoFg_t3FDvgiq2aLQFJj9RcmAmlvJ1ibzzWYvifc';

let supabaseClient: SupabaseClient | null = null;
let userId: string | null = null;
let storedAccessToken: string | null = null;
let apiKey: string | null = null;
let jwtExpiry: number = 0;

/**
 * Exchange API key for JWT by calling the validate-api-key edge function
 */
async function exchangeApiKeyForJWT(key: string): Promise<{ jwt: string; expiresIn: number }> {
  const response = await fetch('https://api.postidentity.com/functions/v1/validate-api-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ apiKey: key })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(`API key validation failed: ${error.error || 'Invalid response'}`);
  }

  const data = await response.json() as any;
  
  if (!data.success || !data.jwt) {
    throw new Error(`API key validation failed: ${data.error || 'No JWT returned'}`);
  }

  return {
    jwt: data.jwt,
    expiresIn: data.expires_in || 604800 // Default 7 days
  };
}

/**
 * Initialize client with either API key or access token
 * API keys (starting with 'pi_') are exchanged for JWTs automatically
 * Access tokens are used directly (legacy support)
 */
export async function initializeClient(credential: string): Promise<SupabaseClient> {
  const isApiKey = credential.startsWith('pi_');
  
  if (isApiKey) {
    // Store API key for re-authentication
    apiKey = credential;
    console.error('🔑 API Key detected - exchanging for JWT...');
    
    const { jwt, expiresIn } = await exchangeApiKeyForJWT(credential);
    storedAccessToken = jwt;
    jwtExpiry = Date.now() + (expiresIn * 1000);
    
    const expiryDate = new Date(jwtExpiry);
    console.error(`✅ JWT obtained (expires in ${Math.floor(expiresIn / 86400)} days: ${expiryDate.toISOString()})`);
  } else {
    // Legacy: Direct access token
    console.error('⚠️  Access token detected (legacy - expires hourly)');
    console.error('💡 Consider using API keys for permanent access: https://postidentity.com/settings');
    storedAccessToken = credential;
  }
  
  // Create Supabase client WITHOUT global headers
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Parse the JWT to get user info
  // JWT structure: header.payload.signature (base64 encoded)
  // According to Supabase docs, 'sub' claim contains the user ID (UUID)
  const tokenParts = storedAccessToken.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('Invalid access token format - JWT must have 3 parts');
  }

  try {
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Extract user ID from 'sub' claim (standard JWT claim for subject/user ID)
    userId = payload.sub;
    
    console.error('✅ Authenticated successfully');
    console.error(`📧 Email: ${payload.email || 'N/A'}`);
    console.error(`🆔 User ID (from JWT 'sub' claim): ${userId}`);
    console.error(`🔑 Role: ${payload.role || 'N/A'}`);
    console.error(`⏰ Token expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'}`);
    
    if (!userId) {
      throw new Error('JWT payload missing required "sub" claim (user ID)');
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    throw new Error(`Failed to parse access token: ${errorMsg}`);
  }

  return supabaseClient;
}

/**
 * Refresh JWT if expired (for API key users only)
 * Call this before each tool execution to ensure valid JWT
 */
export async function refreshIfNeeded(): Promise<void> {
  // Only refresh if using API key
  if (!apiKey) {
    return;
  }

  // Check if JWT is expired or about to expire (within 1 minute)
  const now = Date.now();
  if (now < jwtExpiry - 60000) {
    return; // JWT still valid
  }

  console.error('🔄 JWT expired - refreshing...');
  
  try {
    const { jwt, expiresIn } = await exchangeApiKeyForJWT(apiKey);
    storedAccessToken = jwt;
    jwtExpiry = Date.now() + (expiresIn * 1000);
    
    const expiryDate = new Date(jwtExpiry);
    console.error(`✅ JWT refreshed (expires: ${expiryDate.toISOString()})`);
    
    // Re-parse JWT to update userId (in case it changed)
    const tokenParts = jwt.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      userId = payload.sub;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to refresh JWT: ${errorMsg}`);
    throw new Error(`JWT refresh failed: ${errorMsg}`);
  }
}

export function getUserId(): string {
  if (!userId) {
    throw new Error('Not authenticated');
  }
  return userId;
}

export function getClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Client not initialized');
  }
  return supabaseClient;
}

export function getAccessToken(): string {
  if (!storedAccessToken) {
    throw new Error('Not authenticated');
  }
  return storedAccessToken;
}
