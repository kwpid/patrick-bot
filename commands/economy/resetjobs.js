const { EmbedBuilder } = require('discord.js');
const { recreateJobRequirementsTable, recreateJobsTable } = require('../../utils/economyUtils');

module.exports = {
    name: 'resetjobs',
    description: 'reset job requirements and jobs tables (admin only)',
    async execute(message, client) {
        try {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply("*you don't have permission to use this command!*");
            }

            const success1 = await recreateJobRequirementsTable();
            const success2 = await recreateJobsTable();

            if (success1 && success2) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s jobs')
                    .setDescription("*job tables have been reset successfully!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                message.reply("*something went wrong while resetting the job tables!*");
            }
        } catch (error) {
            console.error('Error in resetjobs command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 