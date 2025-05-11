const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'roll',
    description: 'rolls a 6-sided dice',
    execute(message, client) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        // Generate random number between 1 and 6
        const roll = Math.floor(Math.random() * 6) + 1;

        embed.setTitle("dice roll")
            .setDescription(`*i rolled a ${roll} on a 6-sided dice!*`);

        message.reply({ embeds: [embed] });
    }
}; 