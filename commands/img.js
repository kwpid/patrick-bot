const { EmbedBuilder } = require('discord.js');

// Add your image URLs here
const patrickImages = [
"https://media.discordapp.net/attachments/799428131714367498/1371205284898275409/Z.png?ex=682249ef&is=6820f86f&hm=94144c803c1275eb662aa35ccfa886d74386fa9561af0fbf288ddfa8dba354da&=&format=webp&quality=lossless&width=162&height=253",
"https://media.discordapp.net/attachments/799428131714367498/1371205306599608391/2Q.png?ex=682249f4&is=6820f874&hm=fc3c8706f4b694d6acfaf7701d133162b3836e1f27903a9d96e7a326f9b6ff9a&=&format=webp&quality=lossless&width=202&height=202",
"https://media.discordapp.net/attachments/799428131714367498/1371205511357403166/9k.png?ex=68224a25&is=6820f8a5&hm=593faed672244f6ce5376ff8432e906964205903517a5eb29d3d8dc442aa9f8c&=&format=webp&quality=lossless&width=165&height=248",
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
