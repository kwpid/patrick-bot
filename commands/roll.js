const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'roll',
    description: 'roll a dice',
    execute(message, client) {
        const args = message.content.slice(5).trim();
        let sides = 6;
        
        if (args) {
            const num = parseInt(args);
            if (!isNaN(num) && num > 0 && num <= 100) {
                sides = num;
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("i cant count that high!")
                    .setDescription("max is 100 sides")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
        }

        const roll = Math.floor(Math.random() * sides) + 1;
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("patrick's dice roll")
            .setDescription(`i rolled a **${roll}** on a ${sides}-sided dice\n\n${reaction}`)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 