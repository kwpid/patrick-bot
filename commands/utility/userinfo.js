const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: 'tells you about a user',
    execute(message, client) {
        const args = message.content.slice(10).trim();
        const target = message.mentions.users.first() || 
                      (args ? message.guild.members.cache.find(m => m.user.username.toLowerCase().includes(args.toLowerCase()))?.user : null) || 
                      message.author;

        const member = message.guild.members.cache.get(target.id);
        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .map(role => role.toString())
            .join(', ') || 'no roles';

        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`user info`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'username', value: target.tag, inline: true },
                { name: 'id', value: target.id, inline: true },
                { name: 'joined server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'account created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'roles', value: roles.length > 1024 ? 'too many roles to display' : roles }
            )
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 