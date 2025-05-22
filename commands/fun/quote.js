const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'quote',
    description: 'quotes a message or creates a custom quote',
    usage: 'pa quote [text]',
    aliases: ['q'],
    args: [
        {
            name: 'text',
            type: 'text',
            description: 'the text to quote (optional if replying to a message)'
        }
    ],
    execute(message, client) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        if (message.reference) {
            message.channel.messages.fetch(message.reference.messageId)
                .then(referencedMsg => {
                    embed.setTitle("quote")
                        .setDescription(`> ${referencedMsg.content}\n*~ ${referencedMsg.author.username}*`);
                    message.reply({ embeds: [embed] });
                })
                .catch(() => {
                    embed.setTitle("error")
                        .setDescription("*i couldn't find that message*");
                    message.reply({ embeds: [embed] });
                });
        } else {
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