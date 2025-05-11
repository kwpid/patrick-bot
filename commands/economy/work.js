const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, updateUserData, updateLastWorked } = require('./economyUtils');

module.exports = {
    name: 'work',
    description: 'work for some patrickcoins',
    async execute(message, client) {
        try {
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

            // Generate work question
            const question = "What is 2 + 2?";
            const answer = "4";

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s Work`)
                .setDescription(`*${question}*`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const response = await message.reply({ embeds: [embed] });

            // Create message collector
            const filter = m => m.author.id === message.author.id;
            const collector = response.channel.createMessageCollector({ filter, time: 30000, max: 1 });

            collector.on('collect', async (msg) => {
                const success = msg.content.toLowerCase() === answer.toLowerCase();
                await updateLastWorked(message.author.id);

                if (success) {
                    // Update user balance with salary
                    const salary = userJob.salary;
                    userData.balance += salary;
                    await updateUserData(message.author.id, userData);

                    const embed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s Work`)
                        .setDescription(`*correct!*\n*you earned ${salary} <:patrickcoin:1371211412940132492>!*`)
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    message.reply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${message.author.username}'s Work`)
                        .setDescription('*wrong! try again later!*')
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    message.reply({ embeds: [embed] });
                }
            });
        } catch (error) {
            console.error('Error in work command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 
