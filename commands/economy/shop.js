const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, getUserInventory, updateUserData, getShopItems, addItemToInventory, formatNumber } = require('../../utils/economyUtils');
const { shopItems } = require('../../data/shopItems.json');

const PATRICK_COIN = '<:patrickcoin:1371211412940132492>';
const SHOP_EMOJI = '<:shop:1371495749124100186>';

// Function to check if shop needs to be reset (12 PM EST)
function shouldResetShop() {
    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return est.getHours() === 12 && est.getMinutes() === 0;
}

module.exports = {
    name: 'shop',
    description: 'shows the shop with daily items',
    aliases: ['s'],
    async execute(message, client) {
        try {
            // Check if user is admin and wants to refresh shop
            if (message.content.toLowerCase().includes('refresh')) {
                if (!message.member.permissions.has('Administrator')) {
                    return message.reply("*only administrators can refresh the shop!*");
                }

                await updateShopItems();
                return message.reply("*shop has been refreshed!*");
            }

            let shopItems = await getShopItems();
            
            // If no items in shop or it's time to reset, update the shop
            if (!shopItems || shopItems.length === 0 || shouldResetShop()) {
                await updateShopItems();
                shopItems = await getShopItems();
            }

            // If still no items, show error message
            if (!shopItems || shopItems.length === 0) {
                return message.reply("*the shop is empty right now, check back later!*");
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${SHOP_EMOJI} patrick's shop`)
                .setThumbnail('https://media.discordapp.net/attachments/799428131714367498/1371228930027294720/9k.png?ex=68225ff5&is=68210e75&hm=194a8e609e91114635768cc514b237ec6bca6bec0069150263c4ad8c0ffadd06&=&format=webp&quality=lossless')
                .setDescription(
                    shopItems.map(item => {
                        let itemDisplay = `<:${item.name.toLowerCase().replace(/\s+/g, '_')}:${item.emoji_id}> **${item.name}**\n`;
                        itemDisplay += `├ Price: ${formatNumber(item.price)} ${PATRICK_COIN}\n`;
                        itemDisplay += `├ Description: ${item.description}\n`;
                        itemDisplay += `└ Tags: ${item.tags.join(', ')}`;
                        return itemDisplay;
                    }).join('\n\n')
                )
                .setFooter({ text: 'patrick • resets at 12 PM EST' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('buy')
                        .setLabel('Buy Item')
                        .setStyle(ButtonStyle.Primary)
                );

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
                        content: "*this isn't your shop!*",
                        ephemeral: true
                    });
                }

                const userData = await getUserData(message.author.id);
                if (!userData) {
                    return interaction.reply({
                        content: "*you don't have an account yet!*",
                        ephemeral: true
                    });
                }

                // Create rows with buttons for each item (max 5 buttons per row)
                const rows = [];
                for (let i = 0; i < shopItems.length; i += 5) {
                    const itemRow = new ActionRowBuilder()
                        .addComponents(
                            ...shopItems.slice(i, i + 5).map((item, index) => 
                                new ButtonBuilder()
                                    .setCustomId(`buy_${i + index}`)
                                    .setLabel(`Buy ${item.name}`)
                                    .setStyle(ButtonStyle.Secondary)
                            )
                        );
                    rows.push(itemRow);
                }

                try {
                    // Add a close button to the last row
                    const closeButton = new ButtonBuilder()
                        .setCustomId('close_shop')
                        .setLabel('Close Shop')
                        .setStyle(ButtonStyle.Danger);

                    // Add close button to the last row if there's space, otherwise create a new row
                    if (rows[rows.length - 1].components.length < 5) {
                        rows[rows.length - 1].addComponents(closeButton);
                    } else {
                        rows.push(new ActionRowBuilder().addComponents(closeButton));
                    }

                    await interaction.reply({
                        content: "*which item would you like to buy?*",
                        components: rows,
                        ephemeral: true
                    });

                    const itemCollector = interaction.channel.createMessageComponentCollector({
                        time: 300000 // 5 minutes timeout
                    });

                    itemCollector.on('collect', async (itemInteraction) => {
                        if (itemInteraction.user.id !== message.author.id) {
                            return itemInteraction.reply({
                                content: "*this isn't your shop!*",
                                ephemeral: true
                            });
                        }

                        // Handle close button
                        if (itemInteraction.customId === 'close_shop') {
                            await itemInteraction.update({
                                content: "*shop closed!*",
                                components: []
                            });
                            itemCollector.stop();
                            return;
                        }

                        const itemIndex = parseInt(itemInteraction.customId.split('_')[1]);
                        const item = shopItems[itemIndex];

                        if (!item) {
                            return itemInteraction.reply({
                                content: "*this item is no longer available!*",
                                ephemeral: true
                            });
                        }

                        if (userData.balance < item.price) {
                            return itemInteraction.reply({
                                content: "*you don't have enough coins!*",
                                ephemeral: true
                            });
                        }

                        try {
                            // Update user balance
                            userData.balance -= item.price;
                            await updateUserData(message.author.id, userData);

                            // Add item to inventory
                            const success = await addItemToInventory(message.author.id, item.item_id);
                            
                            if (success) {
                                await itemInteraction.reply({
                                    content: `*you bought ${item.name} for ${formatNumber(item.price)} ${PATRICK_COIN}!*`,
                                    ephemeral: true
                                });
                            } else {
                                // Refund if adding to inventory fails
                                userData.balance += item.price;
                                await updateUserData(message.author.id, userData);
                                throw new Error('Failed to add item to inventory');
                            }
                        } catch (error) {
                            console.error('Error adding item to inventory:', error);
                            try {
                                await itemInteraction.reply({
                                    content: "*something went wrong while buying the item!*",
                                    ephemeral: true
                                });
                            } catch (replyError) {
                                console.error('Error sending error message:', replyError);
                            }
                        }
                    });

                    itemCollector.on('end', () => {
                        try {
                            interaction.editReply({
                                content: "*shop closed!*",
                                components: []
                            }).catch(() => {});
                        } catch (error) {
                            console.error('Error closing shop:', error);
                        }
                    });
                } catch (error) {
                    console.error('Error handling buy interaction:', error);
                    try {
                        await interaction.reply({
                            content: "*something went wrong, try again later!*",
                            ephemeral: true
                        });
                    } catch (replyError) {
                        console.error('Error sending error message:', replyError);
                    }
                }
            });

            collector.on('end', () => {
                try {
                    row.components.forEach(button => button.setDisabled(true));
                    response.edit({ components: [row] }).catch(() => {});
                } catch (error) {
                    console.error('Error disabling shop buttons:', error);
                }
            });
        } catch (error) {
            console.error('Error in shop command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 
