const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, getUserInventory, updateUserData, getShopItems, addItemToInventory, formatNumber, updateShopItems } = require('../../utils/economyUtils');
const { shopItems } = require('../../data/shopItems.json');
const emojis = require ('../../data/emojis.json')


function shouldResetShop() {
    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return est.getHours() === 12 && est.getMinutes() === 0;
}

module.exports = {
    name: 'shop',
    description: 'view and buy items from the shop',
    usage: 'pa shop',
    aliases: ['store', 'buy'],
    async execute(message, client) {
        try {
            if (message.content.toLowerCase().includes('refresh')) {
                if (!message.guild) {
                    return message.reply("*this command can only be used in a server!*");
                }
                const member = message.member || await message.guild.members.fetch(message.author.id);
                if (!member) {
                    return message.reply("*couldn't fetch your member data!*");
                }

                if (!member.permissions.has('Administrator')) {
                    return message.reply("*only administrators can refresh the shop!*");
                }

                await updateShopItems();
                return message.reply("shop has been refreshed");
            }

            const userData = await getUserData(message.author.id);
            if (!userData) {
                return message.reply("*you don't have an account yet!*");
            }

            await updateShopItems();
            let shopItems = await getShopItems();
            
            if (!shopItems || shopItems.length === 0) {
                return message.reply("the shop is empty right now, check back later");
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${emojis.shop} patrick's shop`)
                .setThumbnail('https://media.discordapp.net/attachments/799428131714367498/1371228930027294720/9k.png?ex=68225ff5&is=68210e75&hm=194a8e609e91114635768cc514b237ec6bca6bec0069150263c4ad8c0ffadd06&=&format=webp&quality=lossless')
                .setDescription(
                    shopItems.map(item => {
                        const emojiName = item.item_id;
                        let itemDisplay = `<:${emojiName}:${item.emoji_id}> **${item.name}**\n`;
                        itemDisplay += `├ Price: ${formatNumber(item.price)} ${emojis.coin}\n`;
                        itemDisplay += `├ Description: ${item.description}\n`;
                        if (item.effect_type) {
                            const effectValue = Math.round((item.effect_value - 1) * 100);
                            const effectDuration = item.effect_duration / 60;
                            itemDisplay += `├ Effect: +${effectValue}% ${item.effect_type === 'xp_boost' ? 'XP' : 'Money'} for ${effectDuration} minutes\n`;
                        }
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
                        .setLabel('buy an item')
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
                        content: "this isn't your shop",
                        ephemeral: true
                    });
                }

                if (interaction.customId === 'buy') {
                    const rows = [];
                    for (let i = 0; i < shopItems.length; i += 5) {
                        const itemRow = new ActionRowBuilder()
                            .addComponents(
                                ...shopItems.slice(i, i + 5).map(item => 
                                    new ButtonBuilder()
                                        .setCustomId(`buy_${item.item_id}`)
                                        .setLabel(`buy ${item.name}`)
                                        .setStyle(ButtonStyle.Secondary)
                                )
                            );
                        rows.push(itemRow);
                    }

                    await interaction.update({
                        components: rows
                    });
                } else if (interaction.customId.startsWith('buy_')) {
                    const itemId = interaction.customId.replace('buy_', '');
                    const item = shopItems.find(i => i.item_id === itemId);

                    if (!item) {
                        return interaction.reply({
                            content: "this item is no longer available",
                            ephemeral: true
                        });
                    }

                    if (userData.balance < item.price) {
                        return interaction.reply({
                            content: `you don't have enough ${emojis.coin} to buy this item!`,
                            ephemeral: true
                        });
                    }

                    const success = await addItemToInventory(message.author.id, item.item_id);
                    if (!success) {
                        return interaction.reply({
                            content: "failed to add item to inventory",
                            ephemeral: true
                        });
                    }

                    userData.balance -= item.price;
                    await updateUserData(message.author.id, userData);

                    const buyEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s purchase`)
                        .setDescription(`*you bought ${item.name} for ${formatNumber(item.price)} ${emojis.coin}*`)
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    await interaction.reply({ embeds: [buyEmbed] });

                    const updatedEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${emojis.shop} patrick's shop`)
                        .setDescription("menu closed")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    await response.edit({ embeds: [updatedEmbed], components: [] });
                    collector.stop();
                }
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    const endEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${emojis.shop} patrick's shop`)
                        .setDescription("menu closed")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    response.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error executing shop command:', error);
            return message.reply('An error occurred while executing the shop command.');
        }
    }
}
