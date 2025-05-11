const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ss',
    description: 'Shows server statistics (members, bots, etc.)',
    execute(message, client) {
        const guild = message.guild;
        const totalMembers = guild.memberCount;
        const realMembers = guild.members.cache.filter(member => !member.user.bot).size;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;

        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`Server Stats for ${guild.name}`)
            .addFields(
                { name: 'Total Members', value: totalMembers.toString(), inline: true },
                { name: 'Real Members', value: realMembers.toString(), inline: true },
                { name: 'Bots', value: botCount.toString(), inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 