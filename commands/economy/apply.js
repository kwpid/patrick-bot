const { EmbedBuilder } = require('discord.js');
const { getUserData, getJobRequirements, setUserJob, getUserJob } = require('./economyUtils');

module.exports = {
    name: 'apply',
    description: 'apply for a job',
    aliases: ['job'],
    async execute(message, client) {
        try {
            const args = message.content.split(' ').slice(1);
            if (args.length === 0) {
                return message.reply("*please specify a job ID to apply for! use pa jobs to see available jobs.*");
            }

            const jobId = args[0].toLowerCase();
            const jobReq = await getJobRequirements(jobId);
            
            if (!jobReq) {
                return message.reply("*that job ID doesn't exist! use pa jobs to see available jobs.*");
            }

            const userData = await getUserData(message.author.id);
            if (userData.level < jobReq.required_level) {
                return message.reply(`*you need to be level ${jobReq.required_level} to apply for this job!*`);
            }

            const currentJob = await getUserJob(message.author.id);
            if (currentJob && currentJob.job_name === jobReq.job_name) {
                return message.reply("*you already have this job!*");
            }

            const success = await setUserJob(message.author.id, jobReq.job_name);
            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s jobs')
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