const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserInventory, removeItemFromInventory, updateUserData, addItemToInventory } = require('./economyUtils');
const chests = require('./chests.json').chests;

module.exports = {
    name: 'open',
    description: 'open a chest from your inventory',
    async execute(message, client) {
        try {
            const args = message.content.split(' ');
            if (args.length < 3) {
                return message.reply("*please specify which chest to open! use `pa inventory` to see your chests.*");
            }

            const chestId = args[2].toLowerCase();
            if (!chests[chestId]) {
                return message.reply("*that's not a valid chest!*");
            }

            // Check if user has the chest
            const inventory = await getUserInventory(message.author.id);
            const chest = inventory.find(item => item.item_id === chestId);
            
            if (!chest) {
                return message.reply("*you don't have that chest!*");
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
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s chest')
                .setDescription(
                    `*you opened a ${chestData.name}!*\n\n` +
                    `*rewards:*\n${rewards.map(r => `• ${r}`).join('\n')}`
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in open command:', error);
            message.reply("*something went wrong while opening the chest!*").catch(() => {});
        }
    }
}; 