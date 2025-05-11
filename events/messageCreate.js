const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Check if the bot is mentioned
        if (message.mentions.has(message.client.user)) {
            const responses = [
                "*hello?*",
                "*what?*",
                "*huh?*",
                "*who said my name?*",
                "*yes?*",
                "*what do you want?*",
                "*i'm here...*",
                "*you called?*",
                "*what's up?*",
                "*need something?*"
            ];

            // Get random response
            const response = responses[Math.floor(Math.random() * responses.length)];
            message.reply(response).catch(() => {});
        }
    }
}; 