const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, updateLastWorked } = require('./economyUtils');
const { runRandomGame } = require('./workGames');

module.exports = {
    name: 'work',
    description: 'work for your salary',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);

            if (!userJob) {
                return message.reply("*you need a job first! use `pa jobs` to see available jobs.*");
            }

            // Check if user has worked in the last 5 minutes
            if (userJob.last_worked) {
                const lastWorked = new Date(userJob.last_worked).getTime();
                const timeLeft = Math.ceil((300000 - (Date.now() - lastWorked)) / 1000);
                if (timeLeft > 0) {
                    return message.reply(`*you can work again in ${timeLeft} seconds!*`);
                }
            }

            // Run random minigame
            const success = await runRandomGame(message);

            // Update last worked time regardless of success
            await updateLastWorked(message.author.id);

            if (success) {
                // Update user balance with salary
                const salary = userJob.salary;
                userData.balance += salary;
                await updateUserData(message.author.id, userData);

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s work')
                    .setDescription(`*correct!*\n*you earned ${salary} <:patrickcoin:1371211412940132492>!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s work')
                    .setDescription('*wrong! try again later!*')
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
