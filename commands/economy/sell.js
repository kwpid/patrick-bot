const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getUserData, getUserInventory, removeItemFromInventory, updateUserData } = require('../../utils/economyUtils');
const { shopItems } = require('../../data/shopItems.json');
const emojis = require ('../../data/emojis.json')

module.exports = {
    name: 'sell',
    description: 'sell items from your inventory',
    usage: 'pa sell [item] [quantity]',
    aliases: ['vendor'],
    args: [
        {
            name: 'item',
            type: 'text',
            description: 'the name of the item to sell'
        },
        {
            name: 'quantity',
            type: 'number',
            description: 'how many of the item to sell (defaults to 1)'
        }
    ],
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s sell`)
                    .setDescription("you don't have an account yet!")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const inventory = await getUserInventory(message.author.id);
            if (inventory.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s sell`)
                    .setDescription("your inventory is empty, cant sell nothing")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('sell_item')
                .setPlaceholder('select an item to sell')
                .addOptions(
                    inventory.map(item => ({
                        label: item.name,
                        description: `sell for ${Math.floor(item.price * 0.5)} ${emojis.coin}`,
                        value: item.item_id,
                        emoji: `<:${item.name.toLowerCase().replace(/\s+/g, '_')}:${item.emoji_id}>`
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s Shop`)
                .setDescription("select an item to sell from your inventory")
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const response = await message.reply({
                embeds: [embed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "this isn't your shop",
                        ephemeral: true
                    });
                }

                const itemId = interaction.values[0];
                const item = inventory.find(i => i.item_id === itemId);

                if (!item) {
                    return interaction.reply({
                        content: "this item is no longer available",
                        ephemeral: true
                    });
                }

                const sellPrice = Math.floor(item.price * 0.5);
                const newBalance = userData.balance + sellPrice;
                
                await removeItemFromInventory(message.author.id, item.item_id);
                await updateUserData(message.author.id, { balance: newBalance });

                const sellEmbed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s sell`)
                    .setDescription(`*you sold ${item.name} for ${sellPrice} ${emojis.coin}*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                await interaction.reply({ embeds: [sellEmbed] });

                const updatedEmbed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s sell`)
                    .setDescription("menu closed")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                await response.edit({ embeds: [updatedEmbed], components: [] });
                collector.stop();
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    const endEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s sell`)
                        .setDescription("menu closed")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    response.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error in sell command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s Shop`)
                .setDescription("*something went wrong, try again later!*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
}; 