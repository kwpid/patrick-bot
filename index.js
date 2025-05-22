require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { trackMessage, trackCommand } = require('./utils/economyUtils');

const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

console.log('Starting bot...');
console.log('Checking environment variables...');

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

const deletedMessages = new Map();

console.log('Loading commands...');
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js') && file !== 'economyUtils.js') {
            const command = require(filePath);
            if (command.name) {
                client.commands.set(command.name, command);
                console.log(`Loaded command: ${command.name} (${path.relative(commandsPath, filePath)})`);
            }
        }
    }
}

loadCommands(commandsPath);

client.on('connecting', () => {
    console.log('Connecting to Discord...');
});

client.on('connected', () => {
    console.log('Connected to Discord!');
});

client.on('disconnect', () => {
    console.log('Disconnected from Discord!');
});

const activities = [
    // krusty krab
    { name: 'flipping Krabby Patties at the Krusty Krab', type: ActivityType.Playing },
    { name: 'eating a Krabby Patty at the Krusty Krab', type: ActivityType.Playing },
    { name: 'annoying Squidward at the Krusty Krab', type: ActivityType.Playing },
  
    // jellyfish fields
    { name: 'jellyfishing in Jellyfish Fields', type: ActivityType.Playing },
    { name: 'getting stung in Jellyfish Fields', type: ActivityType.Playing },
    { name: 'dancing with jellyfish in Jellyfish Fields', type: ActivityType.Playing },
  
    // at home
    { name: 'sleeping under his rock', type: ActivityType.Playing },
    { name: 'talking to the TV under his rock', type: ActivityType.Playing },
    { name: 'playing with a bubble wand under his rock', type: ActivityType.Playing },
  
    // with friends
    { name: 'blowing bubbles with SpongeBob', type: ActivityType.Playing },
    { name: 'playing with Gary the snail', type: ActivityType.Playing },
    { name: 'playing dumb with SpongeBob', type: ActivityType.Playing },
  
    // goo la gooner
    { name: 'soaking up sun at Goo Lagoon', type: ActivityType.Playing },
    { name: 'building sandcastles at Goo Lagoon', type: ActivityType.Playing },
  
    // music-related 
    { name: 'rocking out on a guitar', type: ActivityType.Playing },
    { name: 'banging on a drum set', type: ActivityType.Playing },
    { name: 'squawking on a clarinet like Squidward', type: ActivityType.Playing },
    { name: 'trying to play the ukulele', type: ActivityType.Playing },
  
    // misc Bikini Bottom
    { name: 'wandering around Bikini Bottom', type: ActivityType.Playing },
    { name: 'getting lost near the Chum Bucket', type: ActivityType.Playing },
    { name: 'pretending to be smart at the library', type: ActivityType.Playing },
    { name: 'doing nothing at all (and loving it)', type: ActivityType.Playing }
  ];
  

function updatePresence() {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setPresence({
        activities: [activity],
        status: 'online'
    });
}

client.once('ready', () => {
    console.log('=================================');
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot ID: ${client.user.id}`);
    console.log(`Guild ID: ${GUILD_ID}`);
    console.log('=================================');
    
    updatePresence();
    
    setInterval(updatePresence, 15000);

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

client.on('messageDelete', message => {
    if (!message || message.author?.bot) return;
    
    const channelMessages = deletedMessages.get(message.channel.id) || [];
    channelMessages.unshift({
        author: message.author.tag,
        content: message.content || '[No Content]',
        timestamp: Date.now()
    });
    
    if (channelMessages.length > 10) {
        channelMessages.pop();
    }
    
    deletedMessages.set(message.channel.id, channelMessages);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    await trackMessage(message);

    const prefix = 'pa ';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || 
                   client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
        await command.execute(message, client);
        await trackCommand(message);
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply("*something went wrong, try again later!*").catch(() => {});
    }
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

console.log('Attempting to login...');
client.login(BOT_TOKEN).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
