const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getUsableItems, useItem } = require('../../utils/economyUtils');
const emojis = require ('../../data/emojis.json')

module.exports = {
    name: 'use',
    description: 'use an item from your inventory',
    usage: 'pa use',
    aliases: ['consume'],
    args: [
        {
            name: 'item',
            type: 'option',
            description: 'select an item from your inventory to use'
        }
    ],
    async execute(message, client) {
        try {
            const usableItems = await getUsableItems(message.author.id);

            if (usableItems.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s items`)
                    .setDescription("you don't have any usable items in your inventory")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('use_item')
                .setPlaceholder('select an item to use')
                .addOptions(
                    usableItems.map(item => ({
                        label: item.name || 'Unknown Item',
                        description: item.description,
                        value: item.item_id,
                        emoji: item.emoji_id ? { id: item.emoji_id } : undefined
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s items`)
                .setDescription(
                    usableItems.map(item => 
                        `<:${item.name.replace(/\s+/g, '')}:${item.emoji_id}> **${item.name}** (${item.quantity}x)\n${item.description}`
                    ).join('\n\n')
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const response = await message.reply({
                embeds: [embed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id,
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                const itemId = interaction.values[0];
                const result = await useItem(message.author.id, itemId);

                if (result.success) {
                    const effect = result.effect;
                    let effectDescription;
                    switch (effect.type) {
                        case 'xp_boost':
                            const boostPercent = Math.round((effect.value - 1) * 100);
                            effectDescription = `+${boostPercent}% xp for ${effect.duration} minutes`;
                            break;
                        case 'money_boost':
                            const moneyBoostPercent = Math.round((effect.value - 1) * 100);
                            effectDescription = `+${moneyBoostPercent}% money for 10 minutes`;
                            break;
                        default:
                            effectDescription = 'Unknown effect';
                    }

                    const successEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s item use`)
                        .setDescription(
                            `you used a ${result.item ? result.item.name : 'Unknown Item'}\n` +
                            `effect: ${effectDescription}`
                        )
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    await interaction.update({
                        embeds: [successEmbed],
                        components: []
                    });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s item use`)
                        .setDescription(`*${result.message}*`)
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    await interaction.update({
                        embeds: [errorEmbed],
                        components: []
                    });
                }
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    response.edit({
                        components: []
                    }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error in use command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 
