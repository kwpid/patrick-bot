const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'check bot ping',
    execute(message, client) {
        const ping = client.ws.ping;
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle('Pong!')
            .setDescription(`my response time is **${ping}ms**`)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 