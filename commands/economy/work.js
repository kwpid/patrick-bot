const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, updateLastWorked, formatNumber } = require('./economyUtils');
const { runRandomGame } = require('./workGames');

module.exports = {
    name: 'work',
    description: 'work at your job',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);

            if (!userJob) {
                return message.reply("*you don't have a job! use `pa apply` to get one.*");
            }

            // Check if user has worked recently (5 minute cooldown)
            const lastWorked = userJob.last_worked ? new Date(userJob.last_worked) : null;
            const now = new Date();
            if (lastWorked && (now - lastWorked) < 5 * 60 * 1000) {
                const timeLeft = Math.ceil((5 * 60 * 1000 - (now - lastWorked)) / 1000);
                return message.reply(`*you can work again in ${timeLeft} seconds!*`);
            }

            // Run a random minigame
            const gameResult = await runRandomGame(message);
            
            // Update last worked time regardless of success/failure
            await updateLastWorked(message.author.id);
            
            if (gameResult.success) {
                // Validate salary is a positive number
                const salary = Math.max(0, Math.floor(userJob.salary)) || 0;
                
                // Add salary to balance
                userData.balance = (userData.balance || 0) + salary;
                await updateUserData(message.author.id, userData);

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s work')
                    .setDescription(
                        `${gameResult.message}\n` +
                        `*you earned ${formatNumber(salary)} <:patrickcoin:1371211412940132492>!*`
                    )
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s work')
                    .setDescription(
                        `${gameResult.message}\n` +
                        '*you didn\'t earn any coins this time!*'
                    )
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error in work command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 