const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, updateLastWorked, incrementDailyShifts, resetDailyShifts } = require('../../utils/economyUtils');
const { runRandomGame } = require('../../games/workGames');

module.exports = {
    name: 'work',
    description: 'work for some patrickcoins',
    async execute(message, client) {
        try {
            // Reset daily shifts if needed
            await resetDailyShifts();

            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);

            if (!userJob) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription("*you don't have a job! use `pa jobs` to see available jobs.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Check cooldown
            const lastWorked = new Date(userJob.last_worked).getTime();
            const now = Date.now();
            const timeLeft = lastWorked + (5 * 60 * 1000) - now; // 5 minutes cooldown

            if (timeLeft > 0) {
                const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription(`*you need to wait ${minutesLeft} more minutes before working again!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Run a random game
            const result = await runRandomGame(message);

            // Update last worked time and increment shifts
            const worked = await updateLastWorked(message.author.id);
            const shifted = await incrementDailyShifts(message.author.id);

            if (!worked || !shifted) {
                return message.reply("*something went wrong while updating your work status!*");
            }

            if (result.success) {
                // Update user balance with salary
                const salary = userJob.salary;
                userData.balance += salary;
                await updateUserData(message.author.id, userData);

                // Get current shift count and minimum required
                const result = await pool.query(`
                    SELECT j.daily_shifts, jr.min_shifts
                    FROM jobs j
                    JOIN job_requirements jr ON j.job_id = jr.job_id
                    WHERE j.user_id = $1
                `, [message.author.id]);

                const { daily_shifts, min_shifts } = result.rows[0];
                const remainingShifts = Math.max(0, min_shifts - daily_shifts);

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription(
                        `${result.message}\n` +
                        `*you earned ${salary} <:patrickcoin:1371211412940132492>!*\n\n` +
                        `*shifts today: ${daily_shifts}/${min_shifts}*\n` +
                        `*remaining shifts needed: ${remainingShifts}*\n` +
                        `⚠️ *remember: you need to complete ${min_shifts} shifts per day to keep your job!*`
                    )
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription(`${result.message}\n*try again later!*`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error in work command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 