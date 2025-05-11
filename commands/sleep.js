const { EmbedBuilder } = require('discord.js');

const sleepQuotes = [
    "zzz...",
    "sleepin under my rock...",
    "dreamin about jellyfish...",
    "nap time again...",
    "sleepin like a starfish...",
    "i had a dream about ice cream...",
    "rock sleep is best sleep...",
    "me and rocky takin a nap...",
    "i'm real good at sleepin...",
    "dreamin about spongebob..."
];

module.exports = {
    name: 'sleep',
    description: 'patrick says sleepy stuff',
    execute(message, client) {
        const randomQuote = sleepQuotes[Math.floor(Math.random() * sleepQuotes.length)];
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("patrick's sleepy time")
            .setDescription(`${randomQuote}`)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
