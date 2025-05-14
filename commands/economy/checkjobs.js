const { EmbedBuilder } = require('discord.js');
const { getUserJob, getJobRequirements } = require('../../utils/economyUtils');

module.exports = {
    name: 'checkjobs',
    description: 'check the current state of job requirements (admin only)',
    async execute(message, client) {
        try {
            // Check if user is admin
            if (!message.member.permissions.has('Administrator')) {
                return message.reply("you don't have permission to use this command!");
            }

            // Get all jobs from the table
            const result = await getJobRequirements();
            
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s job requirements')
                .setDescription(
                    result.rows.map(job => 
                        `**${job.job_name}**\n` +
                        `├ ID: \`${job.job_id}\`\n` +
                        `├ Level Required: ${job.required_level}\n` +
                        `└ Salary: ${job.salary} <:patrick_coin:1372197322120888452>`
                    ).join('\n\n')
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in checkjobs command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 