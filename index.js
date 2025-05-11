require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Environment variables
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;

if (!GUILD_ID || !CLIENT_ID) {
    console.error('Missing required environment variables: GUILD_ID and CLIENT_ID must be set');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const prefix = 'pa';
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot is configured for guild ID: ${GUILD_ID}`);
    
    // Set bot to guild-specific
    client.user.setPresence({
        activities: [{ name: 'Guild Specific Bot' }],
        status: 'online'
    });

    // Verify guild access
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error(`Bot is not in the specified guild (ID: ${GUILD_ID})`);
        process.exit(1);
    }
});

client.on('messageCreate', async message => {
    // Ignore messages from other guilds
    if (message.guild.id !== GUILD_ID) return;
    
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        command.execute(message, client);
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command.');
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.BOT_TOKEN);
