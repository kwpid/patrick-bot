const { EmbedBuilder } = require('discord.js');
const { recreateAllTables } = require('../economy/economyUtils');

module.exports = {
    name: 'recreatetables',
    description: 'Recreates all database tables (Admin only)',
    async execute(message, client) {
        // Check if user is admin
        if (!message.member.permissions.has('Administrator')) {
            return message.reply("*only administrators can use this command!*");
        }

        try {
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('Recreating Tables')
                .setDescription("*recreating all database tables... this may take a moment.*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const response = await message.reply({ embeds: [embed] });

            const success = await recreateAllTables();

            if (success) {
                embed.setDescription("*all tables have been recreated successfully!*");
            } else {
                embed.setDescription("*something went wrong while recreating the tables!*");
            }

            await response.edit({ embeds: [embed] });
        } catch (error) {
            console.error('Error in recreateTables command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 