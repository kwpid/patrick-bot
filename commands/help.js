const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'cmds',
    description: 'Shows a list of all available commands',
    execute(message, client) {
        const commandsEmbed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle('Available Commands')
            .setDescription('Here are all the available commands:');

        const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(`./${file}`);
            commandsEmbed.addFields({ 
                name: `pa ${command.name}`, 
                value: command.description 
            });
        }

        commandsEmbed.setTimestamp();
        message.reply({ embeds: [commandsEmbed] });
    }
}; 