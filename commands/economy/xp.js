const { EmbedBuilder } = require('discord.js');
const { getUserData, generateProgressBar } = require('./economyUtils');

module.exports = {
    name: 'xp',
    description: 'check your XP and level',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            const progressBar = generateProgressBar(userData.xp, userData.nextLevelXp);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s xp')
                .setDescription(
                    `*level ${userData.level}*\n` +
                    `${progressBar}\n` +
                    `*${userData.xp}/${userData.nextLevelXp} XP*`
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