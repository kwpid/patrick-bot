const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, generateProgressBar, formatNumber } = require('./economyUtils');

module.exports = {
    name: 'profile',
    description: 'view your profile',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);
            const progressBar = generateProgressBar(userData.xp, userData.nextLevelXp);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s profile`)
                .setDescription(
                    `*level: \`${userData.level}\`*\n` +
                    `*${formatNumber(userData.xp)} ${progressBar}\n ${formatNumber(userData.nextLevelXp)} XP*\n` +
                    `*bal: \`${formatNumber(userData.balance)} <:patrickcoin:1371211412940132492>\`*\n\n` +
                    `*job: ${userJob ? userJob.job_name : 'none'}*`
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in profile command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 
