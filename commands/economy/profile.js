const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserInventory, getUserJob, getJobRequirements, generateProgressBar, formatNumber } = require('../../utils/economyUtils');
const emojis = require ('../../data/emojis.json')

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
                    `**level**\n\`${userData.level}\`\n\n` +
                    `**progress**\n\`${userData.xp}/${userData.nextLevelXp} XP\`\n` +
                    `${progressBar}\n\n` +
                    `**balance**\n\`${formatNumber(userData.balance)}\` ${emojis.coin}\n\n` +
                    `**job**\n\`${userJob ? userJob.job_name : 'none'}\``
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
