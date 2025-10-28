#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { listIdentities } from './tools/list-identities.js';
import { generatePost } from './tools/generate-post.js';
import { getCredits } from './tools/get-credits.js';
import { listPosts } from './tools/list-posts.js';
import { getReferralStats } from './tools/get-referral-stats.js';
import { listMarketplaceTemplates } from './tools/list-marketplace-templates.js';
import { createIdentity } from './tools/create-identity.js';
import { archiveIdentity } from './tools/archive-identity.js';
import { initializeClient } from './auth.js';

// Get access token from CLI arguments
const args = process.argv.slice(2);
const accessTokenIndex = args.indexOf('--access-token');

if (accessTokenIndex === -1 || !args[accessTokenIndex + 1]) {
  console.error('❌ PostIdentity MCP Server requires an access token.');
  console.error('Usage: --access-token <your-token>');
  console.error('Get your token from: https://postidentity.com/settings (Developers section)');
  process.exit(1);
}

const accessToken = args[accessTokenIndex + 1];

// Initialize client with access token
await initializeClient(accessToken);

// Create MCP server
const server = new Server(
  {
    name: 'PostIdentity',
    version: '1.1.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_identities',
        description: 'Get a list of your identities/personas from PostIdentity',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by status: "active" (default), "archived", or "all"',
              enum: ['active', 'archived', 'all'],
            },
          },
          required: [],
        },
      },
      {
        name: 'generate_post',
        description: 'Generate a social media post as one of your identities. Costs 1 credit per generation.',
        inputSchema: {
          type: 'object',
          properties: {
            identity_id: {
              type: 'string',
              description: 'The identity to use - can be either the UUID or the identity name (e.g., "Tech Blogger"). Use list_identities to see available identities.',
            },
            thought_content: {
              type: 'string',
              description: 'The content/thought you want to transform into a post (e.g., "I think AI will revolutionize education")',
            },
          },
          required: ['identity_id', 'thought_content'],
        },
      },
      {
        name: 'get_credits',
        description: 'Check your current credit balance. Each post generation costs 1 credit.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_posts',
        description: 'List your generated posts with optional filtering by identity',
        inputSchema: {
          type: 'object',
          properties: {
            profile_id: {
              type: 'string',
              description: 'Optional: Filter posts by a specific identity ID',
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of posts to return (default: 10)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_referral_stats',
        description: 'Get your referral statistics including code, total referrals, and credits earned',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_marketplace_templates',
        description: 'Browse marketplace identity templates with optional category filter',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional: Filter by category (business, creative, or personal)',
              enum: ['business', 'creative', 'personal'],
            },
          },
          required: [],
        },
      },
      {
        name: 'create_identity',
        description: 'Create a new identity from a description and example posts',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name for the identity',
            },
            description: {
              type: 'string',
              description: 'Description of the writing style',
            },
            examples: {
              type: 'array',
              items: { type: 'string' },
              description: 'Example posts that represent the writing style (minimum 3, more is better for accuracy)',
              minItems: 3,
            },
          },
          required: ['name', 'description', 'examples'],
        },
      },
      {
        name: 'archive_identity',
        description: 'Archive an identity (can be restored later from Settings)',
        inputSchema: {
          type: 'object',
          properties: {
            identity_id: {
              type: 'string',
              description: 'The identity to archive - can be either the UUID or the identity name (e.g., "Tech Blogger")',
            },
          },
          required: ['identity_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_identities': {
        const status = args && typeof args.status === 'string' 
          ? (args.status as 'active' | 'archived' | 'all')
          : 'active';
        
        const result = await listIdentities(status);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'generate_post': {
        if (!args || typeof args.identity_id !== 'string') {
          throw new Error('identity_id is required and must be a string');
        }
        if (typeof args.thought_content !== 'string') {
          throw new Error('thought_content is required and must be a string');
        }

        const result = await generatePost(args.identity_id, args.thought_content);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_credits': {
        const result = await getCredits();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'list_posts': {
        const profileId = args && typeof args.profile_id === 'string' ? args.profile_id : undefined;
        const limit = args && typeof args.limit === 'number' ? args.limit : 10;
        
        const result = await listPosts(profileId, limit);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_referral_stats': {
        const result = await getReferralStats();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'list_marketplace_templates': {
        const category = args && typeof args.category === 'string' ? args.category : undefined;
        
        const result = await listMarketplaceTemplates(category);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'create_identity': {
        if (!args || typeof args.name !== 'string') {
          throw new Error('name is required and must be a string');
        }
        if (typeof args.description !== 'string') {
          throw new Error('description is required and must be a string');
        }
        if (!Array.isArray(args.examples)) {
          throw new Error('examples is required and must be an array');
        }
        
        const result = await createIdentity(args.name, args.description, args.examples);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'archive_identity': {
        if (!args || typeof args.identity_id !== 'string') {
          throw new Error('identity_id is required and must be a string');
        }
        
        const result = await archiveIdentity(args.identity_id);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('PostIdentity MCP Server running...');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
