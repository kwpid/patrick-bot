# Patrick Bot - Discord Bot

## Overview
Patrick Bot is a Discord bot based on the SpongeBob SquarePants character Patrick Star. The bot features an economy system, jobs, inventory management, daily rewards, and various fun commands.

## Project Type
This is a **Discord bot application** - it has no frontend/website interface.

## Technology Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Discord.js v14
- **Database**: PostgreSQL (Replit managed)
- **Environment**: Replit NixOS

## Configuration

### Required Environment Variables
All secrets are already configured in Replit Secrets:
- `BOT_TOKEN` - Discord bot authentication token
- `CLIENT_ID` - Discord application client ID
- `GUILD_ID` - Target Discord server ID
- `DATABASE_URL` - PostgreSQL connection string (automatically set)

### Bot Command Prefix
The bot uses the prefix `pa ` (with a space) for all commands.

## Features

### Economy System
- User balance and XP tracking
- Level progression with rewards
- Shop system with items and chests
- Inventory management
- Daily rewards with streak tracking
- Active effects/boosts system

### Job System
- 10 different jobs with level requirements
- Progressive salary increases
- Daily shift limits
- Paycheck system
- Job application and quitting

### Fun Commands
- Random facts, jokes, quotes
- Wisdom and sleep messages
- Image search functionality

### Utility Commands
- User info and server stats
- Help command
- Ping/latency check
- Recent deleted messages tracking

## Database Schema
The bot uses PostgreSQL with the following main tables:
- `economy` - User balance, level, and XP
- `inventory` - User item storage
- `jobs` & `job_requirements` - Job system
- `shop` - Available items for purchase
- `chests` - Chest definitions
- `active_effects` - Temporary boosts
- `daily_rewards` - Daily claim tracking
- `friends` - Friend system
- `guilds` & `guild_members` - Guild functionality
- `gift_logs` - Gift transaction history

## Project Status
✅ Bot is connected and running
✅ Database tables initialized successfully
✅ All commands loaded (31 commands)
✅ Connected to Discord guild: "Blade League Competitive"

## Recent Changes (November 18, 2025)
- Imported from GitHub repository
- Fixed database table creation order (job_requirements before jobs)
- Set up Replit workflow for automatic bot startup
- Configured PostgreSQL database with all required tables
- Added .gitignore for Node.js project

## Running the Bot
The bot starts automatically via the configured workflow. To manually restart:
- The workflow "Patrick Bot" runs `npm start`
- The bot will automatically reconnect to Discord and initialize the database

## Notes
- Database initialization happens automatically on bot startup
- Shop items are seeded from `data/shopItems.json`
- Chests are defined in `data/chests.json`
- Bot updates its status randomly every 15 seconds with SpongeBob-themed activities
