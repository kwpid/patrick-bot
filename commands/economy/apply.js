const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, getJobRequirements, setUserJob } = require('../../utils/economyUtils');

module.exports = {
    name: 'apply',
    description: 'apply for a job',
    async execute(message, client) {
        try {
            const args = message.content.split(' ');
            if (args.length < 3) {
                return message.reply("*please specify which job to apply for! use `pa jobs` to see available jobs.*");
            }

            const jobId = args[2].toLowerCase();
            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);

            if (userJob) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription("*you already have a job! quit your current job first using `pa quit`.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const jobReq = await getJobRequirements(jobId);
            if (!jobReq) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription("*that job doesn't exist! use `pa jobs` to see available jobs.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            if (userData.level < jobReq.required_level) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription(`*you need to be level ${jobReq.required_level} to apply for this job!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const success = await setUserJob(message.author.id, jobId);

            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription(`*you are now working as a ${jobReq.job_name}!*\n*you will earn ${jobReq.salary} <:patrickcoin:1371211412940132492> per shift*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                message.reply("*something went wrong while applying for the job!*");
            }
        } catch (error) {
            console.error('Error in apply command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 
