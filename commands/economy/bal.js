const { EmbedBuilder } = require('discord.js');
const { getUserData, formatNumber } = require('../../utils/economyUtils');
const emojis = require ('../../data/emojis.json')

module.exports = {
    name: 'bal',
    description: 'check your or another user\'s balance',
    usage: 'pa bal [user]',
    aliases: ['balance', 'money'],
    args: [
        {
            name: 'user',
            type: 'user',
            description: 'the user to check balance of (defaults to yourself)'
        }
    ],
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s balance')
                .setDescription(`${formatNumber(userData.balance)} ${emojis.coin}`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in balance command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 
