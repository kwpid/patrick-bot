const { EmbedBuilder } = require('discord.js');
const { getUserData, addFriend } = require('../../utils/economyUtils');
const emojis = require('../../data/emojis.json');

module.exports = {
    name: 'addfriend',
    description: 'send a friend request to another user',
    usage: 'pa addfriend @user',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            if (!userData) {
                return message.reply("*you don't have an account yet!*");
            }

            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                return message.reply("*please mention a user to send a friend request to!*");
            }

            if (targetUser.id === message.author.id) {
                return message.reply("*you can't send a friend request to yourself!*");
            }

            const targetData = await getUserData(targetUser.id);
            if (!targetData) {
                return message.reply("*that user doesn't have an account yet!*");
            }

            const result = await addFriend(message.author.id, targetUser.id);
            
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${emojis.social} friend request`)
                .setDescription(result.message)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing addfriend command:', error);
            return message.reply('An error occurred while executing the addfriend command.');
        }
    }
}; 