const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, updateLastWorked, incrementDailyShifts, resetDailyShifts, pool, getActiveEffects, setUserJob } = require('../../utils/economyUtils');
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

            // Get current shift count and minimum required
            const shiftResult = await pool.query(`
                SELECT j.daily_shifts, jr.min_shifts
                FROM jobs j
                JOIN job_requirements jr ON j.job_id = jr.job_id
                WHERE j.user_id = $1
            `, [message.author.id]);

            const { daily_shifts, min_shifts } = shiftResult.rows[0];

            // Check cooldown
            const lastWorked = new Date(userJob.last_worked).getTime();
            const now = Date.now();
            const timeLeft = lastWorked + (5 * 60 * 1000) - now;

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

            // Check for active beer effect
            const activeEffects = await getActiveEffects(message.author.id);
            const beerEffect = activeEffects.find(effect => effect.item_id === 'beer');
            let gotFired = false;
            let moneyLost = 0;

            if (beerEffect) {
                // 25% chance of getting fired
                if (Math.random() < 0.25) {
                    gotFired = true;
                    moneyLost = Math.floor(userData.balance * 0.1); // Lose 10% of balance
                    await setUserJob(message.author.id, null);
                    await updateUserData(message.author.id, { balance: userData.balance - moneyLost });
                }
            }

            // Run a random game
            const gameResult = await runRandomGame(message);

            // Update last worked time and increment shifts
            const worked = await updateLastWorked(message.author.id);
            const shifted = await incrementDailyShifts(message.author.id);

            if (!worked || !shifted) {
                return message.reply("*something went wrong while updating your work status!*");
            }

            if (gameResult.success) {
                // Calculate salary with beer boost if applicable
                let salary = userJob.salary;
                if (beerEffect && !gotFired) {
                    salary = Math.floor(salary * beerEffect.effect_value);
                }

                // Update user balance with salary
                userData.balance += salary;
                await updateUserData(message.author.id, userData);

                // Get updated shift count
                const updatedShiftResult = await pool.query(`
                    SELECT j.daily_shifts, jr.min_shifts
                    FROM jobs j
                    JOIN job_requirements jr ON j.job_id = jr.job_id
                    WHERE j.user_id = $1
                `, [message.author.id]);

                const { daily_shifts: newDailyShifts, min_shifts: newMinShifts } = updatedShiftResult.rows[0];
                const remainingShifts = Math.max(0, newMinShifts - newDailyShifts);

                let description = `${gameResult.message}\n`;
                
                if (gotFired) {
                    description += `*you got fired for drinking on the job!*\n`;
                    description += `*you lost ${moneyLost} <:patrickcoin:1371211412940132492>!*\n`;
                } else {
                    description += `*you earned ${salary} <:patrickcoin:1371211412940132492>!*\n`;
                    if (beerEffect) {
                        description += `*beer boost active: +${Math.round((beerEffect.effect_value - 1) * 100)}% money!*\n`;
                    }
                }

                description += `\n*shifts today: ${newDailyShifts} (minimum required: ${newMinShifts})*\n`;
                if (remainingShifts > 0) {
                    description += `*remaining minimum shifts: ${remainingShifts}*\n`;
                }
                if (!gotFired) {
                    description += `⚠️ *remember: you need to complete ${newMinShifts} shifts per day to keep your job!*`;
                }

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s work`)
                    .setDescription(description)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s Work`)
                    .setDescription(`${gameResult.message}\n*try again later!*`)
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