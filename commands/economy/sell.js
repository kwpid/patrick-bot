const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserInventory, removeItemFromInventory, updateUserData } = require('./economyUtils');

module.exports = {
    name: 'sell',
    description: 'sell an item from your inventory',
    async execute(message, client) {
        try {
            const args = message.content.split(' ').slice(1);
            if (args.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s shop')
                    .setDescription("*what would you like to sell? use 'pa sell [item name]'*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const itemName = args.join(' ').toLowerCase();
            const userData = await getUserData(message.author.id);
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s shop')
                    .setDescription("*you don't have an account yet!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const inventory = await getUserInventory(message.author.id);
            const item = inventory.find(i => i.name.toLowerCase() === itemName);

            if (!item) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s shop')
                    .setDescription("*you don't have that item!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Calculate sell price (50% of original price)
            const sellPrice = Math.floor(item.price * 0.5);
            const newBalance = userData.balance + sellPrice;
            
            // Remove item and update balance
            await removeItemFromInventory(message.author.id, item.id);
            await updateUserData(message.author.id, { balance: newBalance });

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s shop')
                .setDescription(`*you sold ${item.name} for ${sellPrice} <:patrickcoin:1371211412940132492>!*`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in sell command:', error);
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