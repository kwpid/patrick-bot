const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getShopItems, updateShopItems, addItemToInventory, getUserData } = require('./economyUtils');

const PATRICK_COIN = '<:patrickcoin:1371211412940132492>';

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
                .setTitle('patrick\'s shop')
                .setDescription(
                    shopItems.map(item => {
                        let itemDisplay = `${item.emoji_id} **${item.name}**\n`;
                        itemDisplay += `├ Price: ${item.price} ${PATRICK_COIN}\n`;
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

                await interaction.reply({
                    content: "*which item would you like to buy?*",
                    components: rows,
                    ephemeral: true
                });

                const itemCollector = interaction.channel.createMessageComponentCollector({
                    time: 30000
                });

                itemCollector.on('collect', async (itemInteraction) => {
                    if (itemInteraction.user.id !== message.author.id) {
                        return itemInteraction.reply({
                            content: "*this isn't your shop!*",
                            ephemeral: true
                        });
                    }

                    const itemIndex = parseInt(itemInteraction.customId.split('_')[1]);
                    const item = shopItems[itemIndex];

                    if (userData.balance < item.price) {
                        return itemInteraction.reply({
                            content: "*you don't have enough coins!*",
                            ephemeral: true
                        });
                    }

                    try {
                        await addItemToInventory(message.author.id, item.id);
                        await itemInteraction.reply({
                            content: `*you bought ${item.name} for ${item.price} ${PATRICK_COIN}!*`,
                            ephemeral: true
                        });
                    } catch (error) {
                        console.error('Error adding item to inventory:', error);
                        await itemInteraction.reply({
                            content: "*something went wrong while buying the item!*",
                            ephemeral: true
                        });
                    }

                    itemCollector.stop();
                });

                itemCollector.on('end', () => {
                    interaction.editReply({
                        content: "*shop closed!*",
                        components: []
                    }).catch(() => {});
                });
            });

            collector.on('end', () => {
                row.components.forEach(button => button.setDisabled(true));
                response.edit({ components: [row] }).catch(() => {});
            });
        } catch (error) {
            console.error('Error in shop command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 