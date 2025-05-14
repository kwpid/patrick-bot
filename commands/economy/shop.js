const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, getUserInventory, updateUserData, getShopItems, addItemToInventory, formatNumber, updateShopItems } = require('../../utils/economyUtils');
const { shopItems } = require('../../data/shopItems.json');
const emojis = require ('../../data/emojis.json')


// Function to check if shop needs to be reset (12 PM EST)
function shouldResetShop() {
    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return est.getHours() === 12 && est.getMinutes() === 0;
}

module.exports = {
    name: 'shop',
    description: 'view and buy items from the shop',
    usage: 'pa shop [category/item]',
    aliases: ['store', 'buy'],
    args: [
        {
            name: 'category',
            type: 'option',
            description: 'the category of items to view (optional)'
        },
        {
            name: 'item',
            type: 'text',
            description: 'the name of the item to buy (optional)'
        }
    ],
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

            let shopItems = await getShopItems();
            
            // If no items in shop or it's time to reset, update the shop
            if (!shopItems || shopItems.length === 0 || shouldResetShop()) {
                await updateShopItems();
                shopItems = await getShopItems();
            }

            // If still no items, show error message
            if (!shopItems || shopItems.length === 0) {
                return message.reply("the shop is empty right now, check back later");
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${emojis.shop} patrick's shop`)
                .setThumbnail('https://media.discordapp.net/attachments/799428131714367498/1371228930027294720/9k.png?ex=68225ff5&is=68210e75&hm=194a8e609e91114635768cc514b237ec6bca6bec0069150263c4ad8c0ffadd06&=&format=webp&quality=lossless')
                .setDescription(
                    shopItems.map(item => {
                        // Special case for Devil's Pitchfork
                        const emojiName = item.id === 'devilpitchfork' ? 'devils_pitchfork' : item.id;
                        let itemDisplay = `<:${emojiName}:${item.emoji_id}> **${item.name}**\n`;
                        itemDisplay += `├ Price: ${formatNumber(item.price)} ${emojis.coin}\n`;
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

                const userData = await getUserData(message.author.id);
                if (!userData) {
                    return interaction.reply({
                        content: "you don't have an account yet",
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
                                    .setCustomId(`buy_${item.item_id}`)
                                    .setLabel(`buy ${item.name}`)
                                    .setStyle(ButtonStyle.Secondary)
                            )
                        );
                    rows.push(itemRow);
                }

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${emojis.shop} patrick's shop`)
                    .setThumbnail('https://media.discordapp.net/attachments/799428131714367498/1371228930027294720/9k.png?ex=68225ff5&is=68210e75&hm=194a8e609e91114635768cc514b237ec6bca6bec0069150263c4ad8c0ffadd06&=&format=webp&quality=lossless')
                    .setDescription(
                        shopItems.map(item => {
                            // Special case for Devil's Pitchfork
                            const emojiName = item.id === 'devilpitchfork' ? 'devils_pitchfork' : item.id;
                            let itemDisplay = `<:${emojiName}:${item.emoji_id}> **${item.name}**\n`;
                            itemDisplay += `├ Price: ${formatNumber(item.price)} ${emojis.coin}\n`;
                            itemDisplay += `├ Description: ${item.description}\n`;
                            itemDisplay += `└ Tags: ${item.tags.join(', ')}`;
                            return itemDisplay;
                        }).join('\n\n')
                    )
                    .setFooter({ text: 'patrick • resets at 12 PM EST' })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        ...rows
                    );

                const response = await message.reply({
                    embeds: [embed],
                    components: [row]
                });
            });
        } catch (error) {
            console.error('Error executing shop command:', error);
            return message.reply('An error occurred while executing the shop command.');
        }
    }
}