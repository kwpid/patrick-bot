const { EmbedBuilder } = require('discord.js');
const { getUserData, formatNumber } = require('../../utils/economyUtils');

module.exports = {
    name: 'bal',
    description: 'check your balance',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s balance')
                .setDescription(`${formatNumber(userData.balance)} <:patrick_coin:1372197322120888452>`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in balance command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 
