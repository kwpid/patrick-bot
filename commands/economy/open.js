const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, getUserInventory, removeItemFromInventory, updateUserData, addItemToInventory } = require('../../utils/economyUtils');
const chests = require('../../data/chests.json').chests;
const emojis = require ('../../data/emojis.json')

module.exports = {
    name: 'open',
    description: 'open items from your inventory',
    usage: 'pa open [item]',
    aliases: ['unbox'],
    args: [
        {
            name: 'item',
            type: 'text',
            description: 'the name of the item to open'
        }
    ],
    async execute(message, client) {
        try {
            const inventory = await getUserInventory(message.author.id);
            const userChests = inventory.filter(item => item.type === 'chest');

            if (userChests.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s chests`)
                    .setDescription("you don't have any chests to open")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s chests`)
                .setDescription(
                    userChests.map(chest => 
                        `<:${chest.name.toLowerCase().replace(/\s+/g, '_')}:${chest.emoji_id}> **${chest.name}** ─ ${chest.quantity}\n` +
                        `└ ${chest.description}`
                    ).join('\n\n')
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const rows = [];
            for (let i = 0; i < userChests.length; i += 5) {
                const chestRow = new ActionRowBuilder()
                    .addComponents(
                        ...userChests.slice(i, i + 5).map(chest => 
                            new ButtonBuilder()
                                .setCustomId(`open_${chest.item_id}`)
                                .setLabel(`open ${chest.name}`)
                                .setStyle(ButtonStyle.Secondary)
                        )
                    );
                rows.push(chestRow);
            }

            const response = await message.reply({
                embeds: [embed],
                components: rows
            });

            const collector = response.createMessageComponentCollector({
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "this isn't your chest menu!",
                        ephemeral: true
                    });
                }

                const chestId = interaction.customId.replace('open_', '');
                const chest = userChests.find(c => c.item_id === chestId);
                
                if (!chest) {
                    return interaction.reply({
                        content: "that chest is no longer available!",
                        ephemeral: true
                    });
                }
            
                await removeItemFromInventory(message.author.id, chestId);

                const userData = await getUserData(message.author.id);
                const rewards = [];
                const chestData = chests[chestId];

                for (const reward of chestData.rewards) {
                    if (reward.type === 'coins') {
                        const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
                        userData.balance += amount;
                        rewards.push(`${amount} ${emojis.coin}`);
                    } else if (reward.type === 'item') {
                        for (const item of reward.items) {
                            if (Math.random() < item.chance) {
                                await addItemToInventory(message.author.id, item.id);
                                rewards.push(`1x ${item.id.replace(/_/g, ' ')}`);
                            }
                        }
                    }
                }
            
                await updateUserData(message.author.id, userData);

                const rewardEmbed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s chest`)
                    .setDescription(
                        `*you opened a ${chestData.name}!*\n\n` +
                        `**Rewards:**\n` +
                        rewards.join('\n')
                    )
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                await interaction.reply({ embeds: [rewardEmbed] });

                const updatedEmbed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s chests`)
                    .setDescription("menu closed")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                await response.edit({ embeds: [updatedEmbed], components: [] });
                collector.stop();
            });
        } catch (error) {
            console.error('Error in open command:', error);
            message.reply('An error occurred while processing the command.');
        }
    }
};