const { EmbedBuilder } = require('discord.js');

const jokes = [
    {
        setup: "why did i stare at the orange juice carton?",
        punchline: "it said concentrate."
    },
    {
        setup: "how do i write a paper?",
        punchline: "with paper."
    },
    {
        setup: "why don't i trust stairs?",
        punchline: "they’re always up to something."
    },
    {
        setup: "why did i bring a ladder to the bar?",
        punchline: "cuz i heard the drinks were on the house."
    },
    {
        setup: "what's brown and sticky?",
        punchline: "a stick."
    },
    {
        setup: "what do you call a fish with no eyes?",
        punchline: "fsh."
    },
    {
        setup: "why did i eat my homework?",
        punchline: "the teacher said it was a piece of cake."
    },
    {
        setup: "what do you call cheese that isn’t yours?",
        punchline: "nacho cheese."
    },
    {
        setup: "what’s orange and sounds like a parrot?",
        punchline: "a carrot."
    },
    {
        setup: "why did the jellyfish blush?",
        punchline: "cuz it saw the ocean's bottom."
    }
];

module.exports = {
    name: 'joke',
    description: 'patrick says something funny (maybe)',
    execute(message, client) {
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        const embed = new EmbedBuilder()
            .setColor('#292929') 
            .setTitle("patrick's joke")
            .setDescription(`${randomJoke.setup}\n\n${randomJoke.punchline}`)
            .setFooter({ text: 'patrick star' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
