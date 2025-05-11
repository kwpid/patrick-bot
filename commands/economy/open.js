const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, getUserInventory, removeItemFromInventory, updateUserData, addItemToInventory } = require('./economyUtils');
const chests = require('./chests.json').chests;

module.exports = {
    name: 'open',
    description: 'open a chest from your inventory',
    async execute(message, client) {
        try {
            // Get user's inventory and filter for chests
            const inventory = await getUserInventory(message.author.id);
            const userChests = inventory.filter(item => item.type === 'chest');

            if (userChests.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Chests`)
                    .setDescription("*you don't have any chests to open!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Create embed showing available chests
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s Chests`)
                .setDescription(
                    userChests.map(chest => 
                        `<:${chest.name.toLowerCase().replace(/\s+/g, '_')}:${chest.emoji_id}> **${chest.name}** ─ ${chest.quantity}\n` +
                        `└ ${chest.description}`
                    ).join('\n\n')
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            // Create buttons for each chest type
            const rows = [];
            for (let i = 0; i < userChests.length; i += 5) {
                const chestRow = new ActionRowBuilder()
                    .addComponents(
                        ...userChests.slice(i, i + 5).map(chest => 
                            new ButtonBuilder()
                                .setCustomId(`open_${chest.item_id}`)
                                .setLabel(`Open ${chest.name}`)
                                .setStyle(ButtonStyle.Secondary)
                        )
                    );
                rows.push(chestRow);
            }

            const response = await message.reply({
                embeds: [embed],
                components: rows
            });

            // Create collector for button interactions
            const collector = response.createMessageComponentCollector({
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "*this isn't your chest menu!*",
                        ephemeral: true
                    });
                }

                const chestId = interaction.customId.replace('open_', '');
                const chest = userChests.find(c => c.item_id === chestId);
                
                if (!chest) {
                    return interaction.reply({
                        content: "*that chest is no longer available!*",
                        ephemeral: true
                    });
                }

                // Remove the chest from inventory
                await removeItemFromInventory(message.author.id, chestId);

                // Get user data for updating balance
                const userData = await getUserData(message.author.id);
                const rewards = [];
                const chestData = chests[chestId];

                // Process each reward type
                for (const reward of chestData.rewards) {
                    if (reward.type === 'coins') {
                        const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
                        userData.balance += amount;
                        rewards.push(`${amount} <:patrickcoin:1371211412940132492>`);
                    } else if (reward.type === 'item') {
                        for (const item of reward.items) {
                            if (Math.random() < item.chance) {
                                await addItemToInventory(message.author.id, item.id);
                                rewards.push(`1x ${item.id.replace(/_/g, ' ')}`);
                            }
                        }
                    }
                }

                // Update user's balance
                await updateUserData(message.author.id, userData);

                // Create embed for rewards
                const rewardEmbed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Chest`)
                    .setDescription(
                        `*you opened a ${chestData.name}!*\n\n` +
                        `*rewards:*\n${rewards.map(r => `• ${r}`).join('\n')}`
                    )
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                await interaction.reply({ embeds: [rewardEmbed] });

                // Update the original message to remove the opened chest
                const updatedChests = userChests.filter(c => c.item_id !== chestId);
                if (updatedChests.length === 0) {
                    const emptyEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s Chests`)
                        .setDescription("*you don't have any chests to open!*")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    await response.edit({ embeds: [emptyEmbed], components: [] });
                } else {
                    const updatedEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s Chests`)
                        .setDescription(
                            updatedChests.map(chest => 
                                `<:${chest.name.toLowerCase().replace(/\s+/g, '_')}:${chest.emoji_id}> **${chest.name}** ─ ${chest.quantity}\n` +
                                `└ ${chest.description}`
                            ).join('\n\n')
                        )
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    const updatedRows = [];
                    for (let i = 0; i < updatedChests.length; i += 5) {
                        const chestRow = new ActionRowBuilder()
                            .addComponents(
                                ...updatedChests.slice(i, i + 5).map(chest => 
                                    new ButtonBuilder()
                                        .setCustomId(`open_${chest.item_id}`)
                                        .setLabel(`Open ${chest.name}`)
                                        .setStyle(ButtonStyle.Secondary)
                                )
                            );
                        updatedRows.push(chestRow);
                    }

                    await response.edit({ embeds: [updatedEmbed], components: updatedRows });
                }
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });
        } catch (error) {
            console.error('Error in open command:', error);
            message.reply("*something went wrong while opening the chest!*").catch(() => {});
        }
    }
}; 