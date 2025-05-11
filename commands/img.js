const { EmbedBuilder } = require('discord.js');

// Add your image URLs here
const patrickImages = [
"https://www.google.com/imgres?q=patrick%20image%20funny&imgurl=https%3A%2F%2Fi.pinimg.com%2F236x%2F25%2F12%2F7b%2F25127bf64a5640e30ca92d800fadffda.jpg&imgrefurl=https%3A%2F%2Fwww.pinterest.com%2Fthequeenrhea%2Fpatrick-star%2F&docid=t_jZ8X_F6Pf4OM&tbnid=bWN9QIWHaxT_sM&vet=12ahUKEwjk7qXpkJyNAxV-VTABHQeNADgQM3oECFUQAA..i&w=236&h=232&hcb=2&ved=2ahUKEwjk7qXpkJyNAxV-VTABHQeNADgQM3oECFUQAA",
"https://www.google.com/imgres?q=patrick%20image%20funny&imgurl=https%3A%2F%2Fi.pinimg.com%2F236x%2F4e%2F1f%2Fb6%2F4e1fb612df8640b37c4e3dbbfb617056.jpg&imgrefurl=https%3A%2F%2Fwww.pinterest.com%2Fthequeenrhea%2Fpatrick-star%2F&docid=t_jZ8X_F6Pf4OM&tbnid=KJcyy11sO659nM&vet=12ahUKEwjk7qXpkJyNAxV-VTABHQeNADgQM3oECBUQAA..i&w=236&h=150&hcb=2&ved=2ahUKEwjk7qXpkJyNAxV-VTABHQeNADgQM3oECBUQAA",
"https://www.google.com/imgres?imgurl=https%3A%2F%2Fimg.wattpad.com%2Fcover%2F3939628-288-k61020.jpg&tbnid=ZCGtnHghLFmcxM&vet=12ahUKEwiw0MyEkZyNAxWScjABHTCTCkUQxiAoA3oECAAQJQ..i&imgrefurl=https%3A%2F%2Fwww.wattpad.com%2F11448718-patrick-star-funniest-quotes&docid=McGRO6ek-DD-bM&w=288&h=450&itg=1&q=patrick%20image%20funny&ved=2ahUKEwiw0MyEkZyNAxWScjABHTCTCkUQxiAoA3oECAAQJQ",
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