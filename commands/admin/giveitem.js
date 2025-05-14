const { EmbedBuilder } = require('discord.js');
const { getUserData, addItemToInventory } = require('../../utils/economyUtils');
const { shopItems } = require('../../data/shopItems.json');
const { chests } = require('../../data/chests.json');
const emojis = require('../../data/emojis.json');

module.exports = {
    name: 'giveitem',
    description: 'give an item to a user (admin only)',
    usage: 'pa giveitem [user] [item_id] [quantity]',
    aliases: ['give'],
    args: [
        {
            name: 'user',
            type: 'user',
            description: 'the user to give the item to'
        },
        {
            name: 'item_id',
            type: 'text',
            description: 'the ID of the item to give'
        },
        {
            name: 'quantity',
            type: 'number',
            description: 'how many of the item to give (defaults to 1)'
        }
    ],
    async execute(message, client) {
        try {
            // Check if user is an admin
            if (!message.member.permissions.has('Administrator')) {
                return message.reply("*only administrators can use this command!*");
            }

            const args = message.content.split(' ').slice(1);
            if (args.length < 2) {
                return message.reply("*please provide a user and item ID!*\nUsage: `pa giveitem [user] [item_id] [quantity]`");
            }

            // Parse user
            const userArg = args[0];
            const user = message.mentions.users.first() || await client.users.fetch(userArg).catch(() => null);
            if (!user) {
                return message.reply("*invalid user!*");
            }

            // Parse item ID
            const itemId = args[1].toLowerCase();
            
            // Parse quantity
            const quantity = parseInt(args[2]) || 1;
            if (quantity < 1) {
                return message.reply("*quantity must be at least 1!*");
            }

            // Check if item exists in shop or chests
            const shopItem = shopItems.find(item => item.id === itemId);
            const chestItem = chests[itemId];

            if (!shopItem && !chestItem) {
                return message.reply("*invalid item ID!*");
            }

            // Get user data
            const userData = await getUserData(user.id);
            if (!userData) {
                return message.reply("*that user doesn't have an account yet!*");
            }

            // Add item to inventory
            for (let i = 0; i < quantity; i++) {
                await addItemToInventory(user.id, itemId);
            }

            // Create success embed
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('Item Given')
                .setDescription(
                    `Successfully gave ${quantity}x ${itemId} to ${user.username}`
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in giveitem command:', error);
            message.reply('An error occurred while processing the command.');
        }
    }
}; 