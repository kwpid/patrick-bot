const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ss',
    description: 'shows server statistics (members, bots, etc.)',
    execute(message, client) {
        const guild = message.guild;
        const totalMembers = guild.memberCount;
        const realMembers = guild.members.cache.filter(member => !member.user.bot).size;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;

        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`server stats for ${guild.name}`)
            .addFields(
                { name: 'total members', value: totalMembers.toString(), inline: true },
                { name: 'real members', value: realMembers.toString(), inline: true },
                { name: 'bots', value: botCount.toString(), inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 