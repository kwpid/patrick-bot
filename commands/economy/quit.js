const { EmbedBuilder } = require('discord.js');
const { getUserJob, setUserJob, getLastQuitTime, setLastQuitTime } = require('../../utils/economyUtils');

const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hour in ms

module.exports = {
    name: 'quit',
    description: 'quit your current job',
    async execute(message, client) {
        try {
            const userId = message.author.id;
            const userJob = await getUserJob(userId);

            if (!userJob) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription("*you don't have a job to quit! use `pa jobs` to see available jobs.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Cooldown check
            const lastQuit = await getLastQuitTime(userId);
            const now = Date.now();

            if (lastQuit && now - new Date(lastQuit).getTime() < COOLDOWN_TIME) {
                const remaining = Math.ceil((COOLDOWN_TIME - (now - new Date(lastQuit).getTime())) / 60000);
                return message.reply(`*you must wait ${remaining} more minute(s) before quitting again.*`);
            }

            const success = await setUserJob(userId, null);

            if (success) {
                await setLastQuitTime(userId, now); // Save cooldown
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription("*you have quit your job! use `pa jobs` to see available jobs.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                message.reply("*something went wrong while quitting your job!*");
            }
        } catch (error) {
            console.error('Error in quit command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
};


