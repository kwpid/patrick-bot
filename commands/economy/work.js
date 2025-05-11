const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, updateLastWorked } = require('./economyUtils');
const { runRandomGame } = require('./workGames');

module.exports = {
    name: 'work',
    description: 'work for some patrickcoins',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);

            if (!userJob) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription("*you don't have a job! use `pa jobs` to see available jobs.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Check cooldown
            const lastWorked = new Date(userJob.last_worked).getTime();
            const now = Date.now();
            const timeLeft = lastWorked + (5 * 60 * 1000) - now; // 5 minutes cooldown

            if (timeLeft > 0) {
                const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription(`*you need to wait ${minutesLeft} more minutes before working again!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Run a random game
            const result = await runRandomGame(message);

            // Update last worked time
            await updateLastWorked(message.author.id);

            if (result.success) {
                // Update user balance with salary
                const salary = userJob.salary;
                userData.balance += salary;
                await updateUserData(message.author.id, userData);

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription(`${result.message}\n*you earned ${salary} <:patrickcoin:1371211412940132492>!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription(`${result.message}\n*try again later!*`)
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
