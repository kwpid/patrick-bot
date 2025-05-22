const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserInventory, getUserData } = require('../../utils/economyUtils');
const emojis = require('../../data/emojis.json');

const ITEMS_PER_PAGE = 9;

module.exports = {
    name: 'inventory',
    description: 'view your or another user\'s inventory',
    usage: 'pa inventory [user]',
    aliases: ['inv', 'items'],
    args: [
        {
            name: 'user',
            type: 'user',
            description: 'the user to check inventory of (defaults to yourself)'
        }
    ],
    async execute(message, client) {
        try {
            const items = await getUserInventory(message.author.id);
            
            if (items.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Items`)
                    .setDescription("your inventory is empty")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
            let currentPage = 0;

            function generateEmbed() {
                const start = currentPage * ITEMS_PER_PAGE;
                const end = start + ITEMS_PER_PAGE;
                const pageItems = items.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Items`)
                    .setDescription(
                        pageItems.map(item => 
                            `<:${item.name.toLowerCase().replace(/\s+/g, '_')}:${item.emoji_id}> **${item.name}** ─ ${item.quantity}\n` +
                            `├ Description: ${item.description}\n` +
                            `└ Tags: ${item.tags.join(', ')}`
                        ).join('\n\n')
                    )
                    .setFooter({ 
                        text: `Page ${currentPage + 1}/${totalPages} • patrick` 
                    })
                    .setTimestamp();

                return embed;
            }

            const createButtons = () => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('≪')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('≫')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages - 1)
                    );
            };

            const response = await message.reply({
                embeds: [generateEmbed()],
                components: totalPages > 1 ? [createButtons()] : []
            });

            if (totalPages > 1) {
                const collector = response.createMessageComponentCollector({
                    time: 60000
                });

                collector.on('collect', async (interaction) => {
                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: "this isn't your inventory",
                            ephemeral: true
                        });
                    }

                    switch (interaction.customId) {
                        case 'first':
                            currentPage = 0;
                            break;
                        case 'prev':
                            currentPage = Math.max(0, currentPage - 1);
                            break;
                        case 'next':
                            currentPage = Math.min(totalPages - 1, currentPage + 1);
                            break;
                        case 'last':
                            currentPage = totalPages - 1;
                            break;
                    }

                    await interaction.update({
                        embeds: [generateEmbed()],
                        components: [createButtons()]
                    });
                });

                collector.on('end', () => {
                    response.edit({
                        components: []
                    }).catch(() => {});
                });
            }
        } catch (error) {
            console.error('Error in inventory command:', error);
            message.reply('An error occurred while processing the command.');
        }
    }
}; 