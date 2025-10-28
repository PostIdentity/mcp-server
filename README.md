# Post Identity MCP Server

Generate AI-powered social media posts from any AI assistant that supports the Model Context Protocol (MCP), including Claude Desktop, Windsurf, and more.

## Features

- 🎭 **Access all your identities** - List and use any of your Post Identity personas
- ✍️ **Generate posts instantly** - Create posts without opening the web app
- 💳 **Check credits** - Monitor your credit balance
- 🔒 **Secure** - Uses your existing Post Identity account credentials
- 🔄 **Auto token refresh** - Seamless authentication

## Prerequisites

- Node.js 18+ installed
- A [Post Identity](https://postidentity.com) account
- An MCP-compatible AI assistant (Claude Desktop, etc.)

## Installation

### Option 1: From npm (Recommended)

```bash
npm install -g @post-identity/mcp-server
```

### Option 2: From source

```bash
cd mcp-server
npm install
npm run build
npm link
```

## Setup

### 1. Configure your credentials

```bash
post-identity-mcp setup
```

You'll be prompted for:
- Your Post Identity email
- Your password

The configuration is saved securely to `~/.post-identity/config.json` (mode 0600).

### 2. Add to Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS/Linux:** `~/.config/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "post-identity": {
      "command": "npx",
      "args": ["-y", "@post-identity/mcp-server"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "post-identity": {
      "command": "post-identity-mcp"
    }
  }
}
```

### 3. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

## Usage

Once configured, you can use these commands in Claude:

### List your identities

```
List my Post Identity personas
```

### Generate a post

```
Generate a post as Quantum Dragon about AI trends
```

### Check credit balance

```
How many Post Identity credits do I have?
```

## Available Tools

### `list_identities`
Get a list of all your active identities/personas.

**Example:**
```
You: "Show me my Post Identity identities"
Claude: [calls list_identities]
Claude: "You have 3 identities:
1. Quantum Dragon
   ID: abc123...
   Bio: Tech thought leader focusing on AI...
..."
```

### `generate_post`
Generate a social media post as one of your identities.

**Parameters:**
- `identity_id` (required): The UUID of the identity
- `custom_prompt` (optional): Custom prompt to guide generation

**Example:**
```
You: "Generate a post as Quantum Dragon about AI safety"
Claude: [calls generate_post]
Claude: "✅ Post generated successfully!

──────────────────────────────────────────────────
AI safety isn't just about preventing sci-fi scenarios.
It's about ensuring systems behave predictably TODAY.
...
──────────────────────────────────────────────────

💳 Remaining credits: 24"
```

### `get_credits`
Check your current credit balance.

**Example:**
```
You: "Check my Post Identity credits"
Claude: [calls get_credits]
Claude: "💳 Current Balance: 24 credits

✅ You can generate 24 more posts"
```

## Commands

### Setup
```bash
post-identity-mcp setup
```
Configure with your Post Identity credentials.

### Logout
```bash
post-identity-mcp logout
```
Remove stored configuration.

### Help
```bash
post-identity-mcp help
```
Show usage information.

## Troubleshooting

### "Configuration not found" error
Run `post-identity-mcp setup` to configure your credentials.

### "Session expired" error
Your session token has expired. Run `post-identity-mcp setup` again to re-authenticate.

### Tools not appearing in Claude Desktop
1. Verify the configuration file syntax is correct (valid JSON)
2. Ensure the path to the executable is correct
3. Restart Claude Desktop completely
4. Check Claude Desktop logs (Help → View Logs)

### "Insufficient credits" error
You've run out of credits. Buy more at [postidentity.com/credits](https://postidentity.com/credits).

## Security

- Credentials are stored locally in `~/.post-identity/config.json` with restricted permissions (mode 0600)
- No passwords are stored - only session tokens
- Tokens are automatically refreshed before expiration
- Same security model as the Post Identity web app
- All API calls use HTTPS

## How It Works

1. You authenticate once with email/password
2. The server stores your session token locally
3. When called via MCP, it uses your token to call Post Identity's API
4. Tokens are automatically refreshed as needed
5. Your existing credits and RLS policies apply

## Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/post-identity/issues)
- **Web App:** [postidentity.com](https://postidentity.com)
- **Email:** support@postidentity.com

## License

MIT
