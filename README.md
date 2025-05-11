# Patrick Bot

A Discord bot with prefix commands using Discord.js v14, designed to be guild-specific and deployed on Railway.

## Project Structure

```
├── commands/
│   ├── pong.js
│   ├── serverstats.js
│   └── help.js
├── index.js
├── package.json
├── railway.json
└── .env
```

## Setup Instructions

### Local Development
1. Install Node.js (v16.9.0 or higher)
2. Clone this repository
3. Run `npm install` to install dependencies
4. Create a `.env` file in the root directory and add the following variables:
   ```
   BOT_TOKEN=your_bot_token_here
   GUILD_ID=your_guild_id_here
   CLIENT_ID=your_client_id_here
   ```
5. Run the bot using `npm start`

### Railway Deployment
1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the following environment variables in Railway:
   - `BOT_TOKEN`: Your Discord bot token
   - `GUILD_ID`: Your Discord server ID
   - `CLIENT_ID`: Your bot's client ID
4. Railway will automatically deploy your bot when you push changes

## Environment Variables

The following environment variables are required:

- `BOT_TOKEN`: The token for your Discord bot
- `GUILD_ID`: The ID of the Discord server where the bot will operate
- `CLIENT_ID`: Your bot's client ID

## Available Commands

- `pa pong` - Returns the bot's latency
- `pa ss` - Shows server statistics (members, bots, etc.)
- `pa cmds` - Shows a list of all available commands

## Adding New Commands

To add a new command:
1. Create a new file in the `commands` folder (e.g., `commands/newcommand.js`)
2. Use the following template:
   ```javascript
   module.exports = {
       name: 'commandname',
       description: 'Command description',
       execute(message, client) {
           // Command logic here
       }
   };
   ```
3. The command will be automatically loaded when the bot starts

## Required Permissions

Make sure your bot has the following permissions:
- Read Messages/View Channels
- Send Messages
- Embed Links
- Read Message History 