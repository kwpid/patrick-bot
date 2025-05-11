const { EmbedBuilder } = require('discord.js');

// Add your image URLs here
const patrickImages = [
"https://discord.com/channels/@me/799428131714367498/1371205284663525468",
"https://discord.com/channels/@me/799428131714367498/1371205306876563599",
"https://discord.com/channels/@me/799428131714367498/1371205511579570278",
];

module.exports = {
    name: 'img',
    description: 'shows a random patrick image',
    execute(message, client) {
        if (patrickImages.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle("no images found")
                .setDescription("*i don't have any pictures of me yet*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const randomImage = patrickImages[Math.floor(Math.random() * patrickImages.length)];
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("look at me!")
            .setImage(randomImage)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 
