const { EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('./economyUtils');

// Cooldown map to track user cooldowns
const cooldowns = new Map();
const COOLDOWN_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

module.exports = {
    name: 'paycheck',
    description: 'get your daily paycheck',
    async execute(message, client) {
        try {
            const userId = message.author.id;
            const now = Date.now();
            const cooldownEnd = cooldowns.get(userId);

            if (cooldownEnd && now < cooldownEnd) {
                const timeLeft = Math.ceil((cooldownEnd - now) / 1000 / 60);
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Paycheck`)
                    .setDescription(`*you need to wait ${timeLeft} more minutes before getting another paycheck!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const userData = await getUserData(userId);
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Paycheck`)
                    .setDescription("*you don't have an account yet!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const amount = Math.floor(Math.random() * 401) + 100; // Random amount between 100-500
            const newBalance = userData.balance + amount;
            await updateUserData(userId, { balance: newBalance });

            // Set cooldown
            cooldowns.set(userId, now + COOLDOWN_TIME);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s Paycheck`)
                .setDescription(`*here's your paycheck of ${amount} <:patrickcoin:1371211412940132492>!*`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in paycheck command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s Paycheck`)
                .setDescription("*something went wrong, try again later!*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
}; 