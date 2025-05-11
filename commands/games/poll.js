const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'poll',
    description: 'patrick creates a poll for you',
    execute(message, client) {
        const args = message.content.slice(4).trim().split('|');
        
        if (args.length < 3) {
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle("wrong arguments")
                .setDescription("to make a poll, write it like this:\n`pa poll Question | Option 1 | Option 2 | Option 3`\n\n*I can count up to 10 options*")
                .setFooter({ text: 'patrick star' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const question = args[0].trim();
        const options = args.slice(1).map(opt => opt.trim());
        
        if (options.length > 10) {
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle("that's too many options")
                .setDescription("*i can only count to 10!* please give me fewer options.")
                .setFooter({ text: 'patrick star' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const optionsText = options.map((opt, i) => `${numbers[i]} ${opt}`).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("patrick's poll")
            .setDescription(`**${question}**\n\n${optionsText}\n\n*react with the numbers to vote!*`)
            .setFooter({ text: 'patrick star' })
            .setTimestamp();

        message.reply({ embeds: [embed] }).then(async (pollMessage) => {
            for (let i = 0; i < options.length; i++) {
                await pollMessage.react(numbers[i]);
            }
        });
    }
}; 