const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pong',
    description: 'Returns the bot\'s latency',
    execute(message, client) {
        const ping = client.ws.ping;
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle('🏓 pong!')
            .setDescription(`my response time is **${ping}ms**`)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 