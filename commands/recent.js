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
                .setTitle("no delete messages found")
                .setDescription("*i haven't seen any messages get deleted in this channel*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Format the messages
        const messageList = channelMessages.map(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString();
            return `**${msg.author}** (${time}):\n${msg.content}\n`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("recently deleted messages")
            .setDescription(messageList)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};

