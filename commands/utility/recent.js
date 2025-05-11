const { EmbedBuilder } = require('discord.js');

// Store deleted messages
const deletedMessages = new Map();

// Listen for deleted messages
module.exports = {
    name: 'recent',
    description: 'shows recently deleted messages',
    execute(message, client) {
        // Get deleted messages for this channel
        const channelMessages = deletedMessages.get(message.channel.id) || [];
        
        if (channelMessages.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle("no deleted messages")
                .setDescription("*i haven't seen any deleted messages recently*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("recently deleted messages")
            .setDescription(channelMessages.map(msg => 
                `> ${msg.content}\n*~ ${msg.author}*`
            ).join('\n\n'))
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};

