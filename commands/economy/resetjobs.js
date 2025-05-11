const { EmbedBuilder } = require('discord.js');
const { recreateJobRequirementsTable } = require('./economyUtils');

module.exports = {
    name: 'resetjobs',
    description: 'reset job requirements table (admin only)',
    async execute(message, client) {
        try {
            // Check if user is admin
            if (!message.member.permissions.has('Administrator')) {
                return message.reply("*you don't have permission to use this command!*");
            }

            const success = await recreateJobRequirementsTable();
            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s jobs')
                    .setDescription("*job requirements table has been reset successfully!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                message.reply("*something went wrong while resetting the job requirements table!*");
            }
        } catch (error) {
            console.error('Error in resetjobs command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 