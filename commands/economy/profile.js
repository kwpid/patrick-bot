const { EmbedBuilder } = require('discord.js');
const { getUserData, generateProgressBar } = require('./economyUtils');

module.exports = {
    name: 'profile',
    description: 'shows your profile with level and balance',
    async execute(message, client) {
        const userData = await getUserData(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`${message.author.username}'s Profile`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { 
                    name: 'level', 
                    value: `${userData.level}`, 
                    inline: true 
                },
                {
                    name: 'progress',
                    value: `${userData.xp}/${userData.nextLevelXp} XP\n${generateProgressBar(userData.xp, userData.nextLevelXp)}`
                },
                { 
                    name: 'balance', 
                    value: `${userData.balance} <:patrickcoin:1371211412940132492>`, 
                    inline: true 
                },
            )
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 