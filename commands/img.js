const { EmbedBuilder } = require('discord.js');

// To add images:
// 1. Upload the image to Discord
// 2. Right-click the image
// 3. Click "Copy Media Link" or "Copy Image Address"
// 4. The URL should look like: https://cdn.discordapp.com/attachments/...
const patrickImages = [
    // Add your image URLs here, for example:
    // "https://cdn.discordapp.com/attachments/123456789/987654321/patrick1.png",
    // "https://cdn.discordapp.com/attachments/123456789/987654321/patrick2.png",
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