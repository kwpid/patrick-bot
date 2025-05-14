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
                    .setTitle(`${message.author.username}'s jobs`)
                    .setDescription("you don't have a job to quit! use `pa jobs` to see available jobs")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Remove cooldown check and last quit time references
            const success = await setUserJob(userId, null);

            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s jobs`)
                    .setDescription("you have quit your job! use `pa jobs` to see available jobs")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                message.reply("something went wrong while quitting your job");
            }
        } catch (error) {
            console.error('Error in quit command:', error);
            message.reply("something went wrong, try again later*").catch(() => {});
        }
    }
};


