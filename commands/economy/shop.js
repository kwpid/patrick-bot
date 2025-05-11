const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getShopItems, updateShopItems, addItemToInventory, getUserData } = require('./economyUtils');

const PATRICK_COIN = '<:patrickcoin:1371211412940132492>';

module.exports = {
    name: 'shop',
    description: 'shows the shop with daily items',
    aliases: ['s'],
    async execute(message, client) {
        try {
            let shopItems = await getShopItems();
            
            // If no items in shop or it's a new day, update the shop
            if (!shopItems || shopItems.length === 0) {
                await updateShopItems();
                shopItems = await getShopItems();
            }

            // If still no items, show error message
            if (!shopItems || shopItems.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s shop')
                    .setDescription("*the shop is empty right now, check back later!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s shop')
                .setDescription(
                    shopItems.map(item => {
                        const hasDiscount = item.discount > 0;
                        const finalPrice = hasDiscount ? 
                            Math.floor(item.price * (1 - item.discount)) : 
                            item.price;
                        
                        let itemDisplay = `<:${item.name.toLowerCase()}:${item.emoji_id}> **${item.name}**\n`;
                        itemDisplay += `├ Price: ${hasDiscount ? `~~${item.price}~~ **${finalPrice}**` : finalPrice} ${PATRICK_COIN}\n`;
                        itemDisplay += `├ Description: ${item.description}\n`;
                        itemDisplay += `└ Tags: ${item.tags.join(', ')}`;
                        
                        if (hasDiscount) {
                            itemDisplay += `\n└ **${Math.floor(item.discount * 100)}% OFF!**`;
                        }
                        
                        return itemDisplay;
                    }).join('\n\n')
                )
                .setFooter({ text: 'patrick' })
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

                // Create a new row with buttons for each item
                const itemRow = new ActionRowBuilder()
                    .addComponents(
                        ...shopItems.map((item, index) => 
                            new ButtonBuilder()
                                .setCustomId(`buy_${index}`)
                                .setLabel(`Buy ${item.name}`)
                                .setStyle(ButtonStyle.Secondary)
                        )
                    );

                await interaction.reply({
                    content: "*which item would you like to buy?*",
                    components: [itemRow],
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
                    const finalPrice = item.discount > 0 ? 
                        Math.floor(item.price * (1 - item.discount)) : 
                        item.price;

                    if (userData.balance < finalPrice) {
                        return itemInteraction.reply({
                            content: "*you don't have enough coins!*",
                            ephemeral: true
                        });
                    }

                    await addItemToInventory(message.author.id, item.id);
                    await itemInteraction.reply({
                        content: `*you bought ${item.name} for ${finalPrice} ${PATRICK_COIN}!*`,
                        ephemeral: true
                    });

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
            const errorEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s shop')
                .setDescription("*something went wrong, try again later!*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
}; 
