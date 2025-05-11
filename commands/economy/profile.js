const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, getUserInventory, formatNumber } = require('./economyUtils');

module.exports = {
    name: 'profile',
    description: 'view your profile',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);
            const inventory = await getUserInventory(message.author.id);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s profile')
                .setDescription(
                    `*${message.author.username}*\n\n` +
                    `*level ${userData.level}*\n` +
                    `*${formatNumber(userData.xp)}/${formatNumber(userData.nextLevelXp)} XP*\n` +
                    `*${formatNumber(userData.balance)} <:patrickcoin:1371211412940132492>*\n\n` +
                    `*job: ${userJob ? userJob.job_name : 'none'}*\n` +
                    `*inventory: ${inventory.length} items*`
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