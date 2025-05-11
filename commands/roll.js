const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'roll',
    description: 'rolls a dice with specified number of sides',
    execute(message, client) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        // Get the number of sides from the command
        const args = message.content.split(' ');
        const sides = parseInt(args[1]);

        // Check if a valid number was provided
        if (isNaN(sides) || sides < 1) {
            embed.setTitle("error")
                .setDescription("*i need a number to roll!*");
            return message.reply({ embeds: [embed] });
        }

        // Generate random number between 1 and sides
        const roll = Math.floor(Math.random() * sides) + 1;

        embed.setTitle("dice roll")
            .setDescription(`*i rolled a ${roll} on a ${sides}-sided dice!*`);

        message.reply({ embeds: [embed] });
    }
}; 
