const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'quote',
    description: 'quotes a message or creates a custom quote',
    execute(message, client) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        // Check if the message is a reply
        if (message.reference && message.reference.messageId) {
            // Get the referenced message
            message.channel.messages.fetch(message.reference.messageId)
                .then(referencedMsg => {
                    embed.setTitle("quote")
                        .setDescription(`> ${referencedMsg.content}\n*~ ${referencedMsg.author.username}*`);
                    message.reply({ embeds: [embed] });
                })
                .catch(error => {
                    embed.setTitle("error")
                        .setDescription("*i couldn't find that message*");
                    message.reply({ embeds: [embed] });
                });
        } else {
            // Check if there's custom text after the command
            const args = message.content.split(' ').slice(1);
            if (args.length > 0) {
                const quoteText = args.join(' ');
                embed.setTitle("quote")
                    .setDescription(`> ${quoteText}\n*~ ${message.author.username}*`);
                message.reply({ embeds: [embed] });
            } else {
                embed.setTitle("error")
                    .setDescription("*reply to a message or provide text to quote*");
                message.reply({ embeds: [embed] });
            }
        }
    }
}; 