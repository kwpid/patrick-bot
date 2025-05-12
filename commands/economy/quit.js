const { EmbedBuilder } = require('discord.js');
const { getUserJob, setUserJob } = require('./economyUtils');

module.exports = {
    name: 'quit',
    description: 'quit your current job',
    async execute(message, client) {
        try {
            const userJob = await getUserJob(message.author.id);

            if (!userJob) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription("*you don't have a job to quit! use `pa jobs` to see available jobs.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const success = await setUserJob(message.author.id, null);

            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription(`*you have quit your job as a ${userJob.job_name}!*`)
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
