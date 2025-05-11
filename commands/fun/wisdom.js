const { EmbedBuilder } = require('discord.js');

const wisdom = [
    "the inner machinations of my mind are an enigma... *taps head*",
    "is mayonnaise an instrument?",
    "the best time to wear a striped sweater is all the time!",
    "i'm not a Krusty Krab...",
    "f is for friends who do stuff together!",
    "the lid... the lid... the lid...",
    "i love you...",
    "we should take Bikini Bottom and push it somewhere else!",
    "i'm ready! i'm ready! i'm ready!",
    "the best time to wear a purple sweater is all the time!",
    "i don't get it...",
    "is this the Krusty Krab?",
    "no, this is patrick!",
    "i'm not a Krusty Krab...",
    "the inner machinations of my mind are an enigma...",
    "i'm a Goofy Goober!",
    "the best time to wear a pink sweater is all the time!",
    "i'm not a Krusty Krab...",
    "the best time to wear a blue sweater is all the time!",
    "i'm not a Krusty Krab..."
];

module.exports = {
    name: 'wisdom',
    description: 'patrick shares his unique wisdom',
    execute(message, client) {
        const randomWisdom = wisdom[Math.floor(Math.random() * wisdom.length)];
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("patrick's wisdom")
            .setDescription(randomWisdom)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 