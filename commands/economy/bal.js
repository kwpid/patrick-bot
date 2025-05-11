const { EmbedBuilder } = require('discord.js');
const { getUserData } = require('./economyUtils');

module.exports = {
    name: 'bal',
    description: 'shows your patrick balance',
    async execute(message, client) {
        const userData = await getUserData(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle('balance')
            .setDescription(`*you have ${userData.balance} <:patrickcoin:1371211412940132492>*`)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 