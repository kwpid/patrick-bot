const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, getJobRequirements } = require('../../utils/economyUtils');
const emojis = require ('../../data/emojis.json')

const cooldowns = new Map();
const COOLDOWN_TIME = 30 * 60 * 1000;

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
                    .setTitle(`${message.author.username}'s paycheck`)
                    .setDescription(`you need to wait ${timeLeft} more minutes before getting another paycheck`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const userData = await getUserData(userId);
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s paycheck`)
                    .setDescription("you don't have an account yet!")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const amount = Math.floor(Math.random() * 401) + 100;
            const boostedAmount = Math.floor(amount * 1.05);
            const newBalance = userData.balance + boostedAmount;
            await updateUserData(userId, { balance: newBalance });

            cooldowns.set(userId, now + COOLDOWN_TIME);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s paycheck`)
                .setDescription(`here's your paycheck of ${amount} ${emojis.coin}`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in paycheck command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s paycheck`)
                .setDescription("something went wrong, try again later!")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
}; 