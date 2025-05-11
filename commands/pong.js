const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pong',
    description: 'Returns the bot\'s latency',
    execute(message, client) {
        const ping = client.ws.ping;
        const embed = new EmbedBuilder()
            .setColor('#FFB6C1')
            .setTitle('🏓 Pong!')
            .setDescription(`My response time is **${ping}ms**`)
            .setFooter({ text: 'Patrick Bot' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 