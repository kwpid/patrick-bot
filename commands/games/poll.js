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
                .setDescription("to make a poll, write it like this:\n`pa poll Question | Option 1 | Option 2 | Option 3 [time]`\n\n*I can count up to 10 options*\n*Time format: 1m (1 minute), 2h (2 hours), 3d (3 days)*")
                .setFooter({ text: 'patrick star' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Parse time argument if present
        let duration = null;
        let question = args[0].trim();
        let options = args.slice(1).map(opt => opt.trim());

        // Check if last option contains time
        const lastOption = options[options.length - 1];
        const timeMatch = lastOption.match(/^(\d+)([mhd])$/);
        
        if (timeMatch) {
            const [, amount, unit] = timeMatch;
            const multiplier = {
                'm': 60 * 1000,      // minutes to milliseconds
                'h': 3600 * 1000,    // hours to milliseconds
                'd': 86400 * 1000    // days to milliseconds
            };
            duration = parseInt(amount) * multiplier[unit];
            options = options.slice(0, -1); // Remove time from options
        }

        // Remove 'oll' from question if it starts with it
        if (question.toLowerCase().startsWith('oll ')) {
            question = question.slice(4).trim();
        }
        
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
            .setDescription(`**${question}**\n\n${optionsText}\n\n*react with the numbers to vote!*${duration ? `\n*poll ends in ${duration/1000/60} minutes*` : ''}`)
            .setFooter({ text: 'patrick star' })
            .setTimestamp();

        message.reply({ embeds: [embed] }).then(async (pollMessage) => {
            for (let i = 0; i < options.length; i++) {
                await pollMessage.react(numbers[i]);
            }

            // If duration is set, end the poll after that time
            if (duration) {
                setTimeout(async () => {
                    const fetchedMessage = await pollMessage.fetch();
                    const reactions = fetchedMessage.reactions.cache;
                    
                    let results = options.map((opt, i) => {
                        const reaction = reactions.get(numbers[i]);
                        return {
                            option: opt,
                            votes: reaction ? reaction.count - 1 : 0 // Subtract 1 for bot's reaction
                        };
                    });

                    // Sort by votes
                    results.sort((a, b) => b.votes - a.votes);

                    const resultsText = results.map(r => 
                        `${r.option}: ${r.votes} vote${r.votes !== 1 ? 's' : ''}`
                    ).join('\n');

                    const endEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle("patrick's poll ended")
                        .setDescription(`**${question}**\n\n${resultsText}`)
                        .setFooter({ text: 'patrick star' })
                        .setTimestamp();

                    message.channel.send({ embeds: [endEmbed] });
                }, duration);
            }
        });
    }
}; 
