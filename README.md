# PostIdentity MCP Server

Official MCP server for [PostIdentity](https://postidentity.com) - Generate AI-powered social media posts from any AI assistant that supports the Model Context Protocol (MCP).

## Features

- 🎭 **Manage Identities** - List, create, and archive your writing personas
- ✍️ **Generate Posts** - Transform thoughts into posts instantly
- 📝 **Review Posts** - Browse your post history on specific identities
- 💳 **Check Credits** - Monitor your credit balance
- 🎁 **Track Referrals** - View your referral stats and code
- 🛍️ **Browse Marketplace** - Discover identity templates
- 🔒 **Secure** - Token-based authentication with RLS protection

## Prerequisites

- Node.js 18+ (for local development)
- A [PostIdentity](https://postidentity.com) account
- An MCP-compatible AI assistant (Windsurf, Claude Desktop, etc.)

## Quick Start

### 1. Get Your Access Token

1. Go to [postidentity.com/settings](https://postidentity.com/settings)
2. Expand the **"Developers"** section
3. Copy your **Access Token**

### 2. Configure Your MCP Client

```json
{
  "mcpServers": {
    "postidentity": {
      "command": "npx",
      "args": [
        "-y",
        "@postidentity/mcp-server@latest",
        "--access-token",
        "YOUR_ACCESS_TOKEN_HERE"
      ]
    }
  }
}
```

## Available Tools

### 1. `list_identities` 
Get your writing identities.

**Parameters:**
- `status` (optional): Filter by "active" (default), "archived", or "all"

**Examples:**
```
"Show me my PostIdentity identities"
"Show me my archived identities"
"Show me all my identities"
```

### 2. `generate_post`
Transform a thought into a post using an identity's style.

**Parameters:**
- `identity_id` (required): Identity UUID or name (e.g., "Tech Blogger")
- `thought_content` (required): Your thought/idea

**Example:**
```
"Generate a post as Tech Blogger about AI trends"
```

**Cost:** 1 credit per generation

### 3. `get_credits`
Check your current credit balance.

**Example:**
```
"How many PostIdentity credits do I have?"
```

### 4. `list_posts`
Browse your generated posts.

**Parameters:**
- `profile_id` (optional): Filter by identity
- `limit` (optional): Number of posts (default: 10)

**Example:**
```
"Show me my last 5 posts"
```

### 5. `get_referral_stats`
View your referral code and stats.

**Example:**
```
"What's my PostIdentity referral code?"
```

### 6. `list_marketplace_templates`
Browse identity templates in the marketplace.

**Parameters:**
- `category` (optional): Filter by business/creative/personal

**Example:**
```
"Show me business identity templates"
```

### 7. `create_identity`
Create a new identity from examples.

**Parameters:**
- `name` (required): Identity name
- `description` (required): Writing style description
- `examples` (required): Array of 3+ example posts (more = better accuracy)

**Example:**
```
"Create a tech blogger identity with these examples: ..."
```

### 8. `archive_identity`
Archive an identity (can be restored later).

**Parameters:**
- `identity_id` (required): Identity UUID or name to archive

**Example:**
```
"Archive my Tech Blogger identity"
```

## Usage Examples

### List Your Identities
```
You: "List my PostIdentity identities"
AI: "Found 2 identities:
     1. Tech Thought Leader
        ID: abc123...
     2. Casual Developer
        ID: def456..."
```

### Generate a Post
```
You: "Generate a post as Tech Thought Leader about AI safety"
AI: "✅ Post generated successfully!
     
     AI safety isn't about preventing sci-fi scenarios.
     It's about ensuring predictable behavior TODAY.
     
     💳 Remaining credits: 45"
```

### Check Credits
```
You: "How many credits do I have?"
AI: "💳 Current Balance: 45 credits
     ✅ You can generate 45 more posts"
```

### View Referral Stats
```
You: "What's my referral code?"
AI: "🎁 Referral Stats
     📋 Your Code: ABC123XY
     👥 Total Referrals: 3
     💰 Credits Earned: 15"
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/PostIdentity/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js --access-token YOUR_TOKEN
```

## Security

✅ **Token-based authentication** - No passwords stored  
✅ **Row Level Security (RLS)** - Database-level access control  
✅ **User isolation** - Can only access your own data  
✅ **Credit system** - Natural rate limiting  
✅ **Audit trail** - All transactions logged  

## Troubleshooting

### Tools Not Appearing
1. Verify JSON syntax in config file
2. Check token is correct and not expired
3. Restart your AI assistant completely
4. Check logs for errors

### Authentication Errors
1. Get fresh token from [postidentity.com/settings](https://postidentity.com/settings)
2. Update your MCP config with new token
3. Restart AI assistant

### "Insufficient Credits" Error
Buy credits at [postidentity.com/credits](https://postidentity.com/credits)

## How It Works

1. You provide your access token in the MCP config
2. Server authenticates using token on startup
3. Token is used for all API requests to PostIdentity
4. All operations respect your credits and RLS policies

## Credits & Pricing

- **Free Trial:** 5 credits on signup
- **Generation:** 1 credit per post
- **Referrals:** 5 credits per referral (for both users)
- **Pricing:** Starting at $5 for 15 credits

[Buy credits →](https://postidentity.com/credits)

## Links

- 🌐 **Web App:** [postidentity.com](https://postidentity.com)
- 📦 **npm Package:** [@postidentity/mcp-server](https://www.npmjs.com/package/@postidentity/mcp-server)
- 🐛 **Issues:** [GitHub Issues](https://github.com/PostIdentity/mcp-server/issues)
- 📧 **Support:** support@postidentity.com

## Contributing

Contributions are welcome! Please open an issue or submit a PR.

## License

MIT © PostIdentity

---

**Made with ❤️ by the PostIdentity team**
