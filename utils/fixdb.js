const { SlashCommandBuilder } = require('discord.js');
const { addMissingColumns } = require('./economyUtils');
const { Pool } = require('pg');
const { shopItems } = require('../data/shopItems.json');
const { chests } = require('../data/chests.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixdb')
        .setDescription('Fix database issues (Admin only)'),

    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ You need Administrator permissions to use this command.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const result = await addMissingColumns();
            if (result) {
                await interaction.editReply('✅ Database fixes applied successfully!');
            } else {
                await interaction.editReply('❌ Failed to apply database fixes. Check console for details.');
            }
        } catch (error) {
            console.error('Error in fixdb command:', error);
            await interaction.editReply('❌ An error occurred while fixing the database. Check console for details.');
        }
    },
}; 