require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Environment variables
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

console.log('Starting bot...');
console.log('Checking environment variables...');

// Validate environment variables
if (!BOT_TOKEN) {
    console.error('Error: BOT_TOKEN is not set in environment variables');
    process.exit(1);
}

if (!GUILD_ID) {
    console.error('Error: GUILD_ID is not set in environment variables');
    process.exit(1);
}

if (!CLIENT_ID) {
    console.error('Error: CLIENT_ID is not set in environment variables');
    process.exit(1);
}

console.log('Environment variables validated successfully');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
});

const prefix = 'pa';
client.commands = new Collection();

// Load commands
console.log('Loading commands...');
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.name, command);
    console.log(`Loaded command: ${command.name}`);
}

// Connection events
client.on('connecting', () => {
    console.log('Connecting to Discord...');
});

client.on('connected', () => {
    console.log('Connected to Discord!');
});

client.on('disconnect', () => {
    console.log('Disconnected from Discord!');
});

client.once('ready', () => {
    console.log('=================================');
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot ID: ${client.user.id}`);
    console.log(`Guild ID: ${GUILD_ID}`);
    console.log('=================================');
    
    // Set bot to guild-specific
    client.user.setPresence({
        activities: [{ name: 'Guild Specific Bot' }],
        status: 'online'
    });

    // Verify guild access
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error(`Error: Bot is not in the specified guild (ID: ${GUILD_ID})`);
        console.log('Available guilds:');
        client.guilds.cache.forEach(g => {
            console.log(`- ${g.name} (${g.id})`);
        });
        process.exit(1);
    }
    
    console.log(`Successfully verified access to guild: ${guild.name}`);
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
        console.error('Command execution error:', error);
        message.reply('There was an error executing that command.');
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login with error handling
console.log('Attempting to login...');
client.login(BOT_TOKEN).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
