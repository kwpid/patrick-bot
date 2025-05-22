const { EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, addItemToInventory } = require('../../utils/economyUtils');
const { Pool } = require('pg');
const emojis = require('../../data/emojis.json');

// Create a new pool using Railway's DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    name: 'daily',
    description: 'claim your daily rewards',
    usage: 'pa daily',
    aliases: ['claim'],
    async execute(message, client) {
        try {
            // Get user data
            const userData = await getUserData(message.author.id);
            if (!userData) {
                return message.reply("*you don't have an account yet!*");
            }

            // Get or create daily rewards data
            const dailyResult = await pool.query(
                'SELECT * FROM daily_rewards WHERE user_id = $1',
                [message.author.id]
            );

            let dailyData;
            if (dailyResult.rows.length === 0) {
                // Create new daily rewards entry
                await pool.query(
                    'INSERT INTO daily_rewards (user_id, streak, last_claimed) VALUES ($1, 0, NULL)',
                    [message.author.id]
                );
                dailyData = { streak: 0, last_claimed: null };
            } else {
                dailyData = dailyResult.rows[0];
            }

            // Check if user can claim reward
            const now = new Date();
            const lastClaimed = dailyData.last_claimed ? new Date(dailyData.last_claimed) : null;
            const canClaim = !lastClaimed || (now - lastClaimed) >= 24 * 60 * 60 * 1000;

            if (!canClaim) {
                const timeLeft = new Date(lastClaimed.getTime() + 24 * 60 * 60 * 1000);
                const hoursLeft = Math.ceil((timeLeft - now) / (60 * 60 * 1000));
                
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s daily reward`)
                    .setDescription(`*you can claim your daily reward in ${hoursLeft} hours!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Calculate reward
            let streak = dailyData.streak;
            if (lastClaimed && (now - lastClaimed) >= 48 * 60 * 60 * 1000) {
                // Reset streak if more than 48 hours have passed
                streak = 0;
            }
            streak = Math.min(streak + 1, 7); // Cap streak at 7 days
            const reward = 100 * streak; // 100 coins per day of streak

            // Update user's balance
            userData.balance += reward;
            await updateUserData(message.author.id, userData);

            // Update daily rewards data
            await pool.query(
                'UPDATE daily_rewards SET streak = $1, last_claimed = CURRENT_TIMESTAMP WHERE user_id = $2',
                [streak, message.author.id]
            );

            // Create reward embed
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s daily reward`)
                .setDescription(
                    `*you claimed your daily reward!*\n\n` +
                    `**Rewards:**\n` +
                    `• ${reward} ${emojis.coin}\n` +
                    `• Streak: ${streak}/7 days`
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            // Add chest rewards for days 5 and 7
            if (streak === 5) {
                await addItemToInventory(message.author.id, 'chest_1');
                embed.data.description += `\n• 1x Basic Chest (5-day streak reward!)`;
            } else if (streak === 7) {
                await addItemToInventory(message.author.id, 'chest_2');
                embed.data.description += `\n• 1x Rare Chest (7-day streak reward!)`;
            }

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in daily command:', error);
            message.reply('An error occurred while processing the command.');
        }
    }
}; 