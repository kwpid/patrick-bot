const { EmbedBuilder } = require('discord.js');
const { getUserData, generateProgressBar, formatNumber } = require('../../utils/economyUtils');

module.exports = {
    name: 'xp',
    description: 'check your xp and level',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            const progressBar = generateProgressBar(userData.xp, userData.nextLevelXp);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s xp`)
                .setDescription(
                    `*level ${userData.level}*\n` +
                    `${progressBar}\n` +
                    `*${formatNumber(userData.xp)}/${formatNumber(userData.nextLevelXp)} XP*`
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in xp command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 