const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserInventory, getUserData } = require('../../utils/economyUtils');

const ITEMS_PER_PAGE = 9;

module.exports = {
    name: 'inventory',
    description: 'shows your inventory',
    aliases: ['inv'],
    async execute(message, client) {
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
                        `<:${item.name.toLowerCase().replace(/\s+/g, '_')}:${item.emoji_id}> ${item.name} ─ ${item.quantity}\n` +
                        `Description: ${item.description}\n` +
                        `Tags: ${item.tags.join(', ')}`
                    ).join('\n\n')
                )
                .setFooter({ 
                    text: `Page ${currentPage + 1}/${totalPages} • patrick` 
                })
                .setTimestamp();

            return embed;
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages - 1)
            );

        const response = await message.reply({
            embeds: [generateEmbed()],
            components: totalPages > 1 ? [row] : []
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

                if (interaction.customId === 'prev') {
                    currentPage--;
                } else if (interaction.customId === 'next') {
                    currentPage++;
                }

                row.components[0].setDisabled(currentPage === 0);
                row.components[1].setDisabled(currentPage === totalPages - 1);

                await interaction.update({
                    embeds: [generateEmbed()],
                    components: [row]
                });
            });

            collector.on('end', () => {
                row.components.forEach(button => button.setDisabled(true));
                response.edit({ components: [row] }).catch(() => {});
            });
        }
    }
}; 