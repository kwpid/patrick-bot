const { EmbedBuilder } = require('discord.js');
const facts = [
    "did u know my rock's name is rocky?",
    "my name is patrick star. that's me.",
    "ice cream is my favorite food. it’s cold and yummy.",
    "i live under a rock. it’s the best house ever.",
    "spongebob is my best friend. we do stuff together.",
    "pink is my favorite color. it’s the same as me.",
    "is mayonnaise an instrument?",
    "the magic conch is always right.",
    "i like watching mermaid man and barnacle boy.",
    "sweet victory is the best song ever."
];

module.exports = {
    name: 'fact',
    description: 'patrick says a thing',
    execute(message, client) {
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        const embed = new EmbedBuilder()
            .setColor('#292929') // light pink, patrick vibes
            .setTitle("patrick's thought")
            .setDescription(randomFact)
            .setFooter({ text: 'patrick star' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
