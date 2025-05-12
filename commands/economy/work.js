const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, updateLastWorked, incrementDailyShifts, resetDailyShifts, pool, getActiveEffects, setUserJob, getJobRequirements, getActiveBoostInfo, getMoneyBoostMultiplier, formatBoostInfo } = require('../../utils/economyUtils');
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
                    .setTitle(`${message.author.username}'s work`)
                    .setDescription("*you don't have a job! use `pa jobs` to see available jobs.*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Check if user has worked recently
            if (userJob.last_worked) {
                const lastWorked = new Date(userJob.last_worked);
                const now = new Date();
                const timeDiff = now - lastWorked;
                const minutesDiff = timeDiff / (1000 * 60);

                if (minutesDiff < 15) {
                    const minutesLeft = Math.ceil(15 - minutesDiff);
                    return message.reply(`*you can work again in ${minutesLeft} minutes!*`);
                }
            }

            // Get job requirements
            const jobReq = await getJobRequirements(userJob.job_id);
            if (!jobReq) {
                return message.reply("*something went wrong, try again later!*");
            }

            // Get money boost if any
            const moneyBoost = await getMoneyBoostMultiplier(message.author.id);
            const baseSalary = jobReq.salary;
            const finalSalary = Math.floor(baseSalary * moneyBoost);

            // Get active boosts for display
            const activeBoosts = await getActiveBoostInfo(message.author.id);

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
                let salary = finalSalary;
                salary = Math.floor(salary * 1.05); // +5% more money for every work shift

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

                const { daily_shifts: newDailyShifts, min_shifts: newMinShifts } = updatedShiftResult.rows[0] || { daily_shifts: 0, min_shifts: 0 };
                const remainingShifts = Math.max(0, newMinShifts - newDailyShifts);

                let description = `${gameResult.message}\n`;
                
                if (gotFired) {
                    description += `*you got fired for drinking on the job!*\n`;
                    description += `*you lost ${moneyLost} <:patrickcoin:1371211412940132492>!*\n`;
                } else {
                    description += `*you earned ${salary} <:patrickcoin:1371211412940132492>!*\n`;
                }

                description += `\n*shifts today: ${newDailyShifts} (minimum required: ${newMinShifts})*\n`;
                if (remainingShifts > 0) {
                    description += `*remaining minimum shifts: ${remainingShifts}*\n`;
                }
                if (!gotFired) {
                    description += `⚠️ *remember: you need to complete ${newMinShifts} shifts per day to keep your job!*`;
                }

                // Add active boosts if any
                if (activeBoosts.length > 0) {
                    description += formatBoostInfo(activeBoosts);
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
                    .setTitle(`${message.author.username}'s work`)
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
