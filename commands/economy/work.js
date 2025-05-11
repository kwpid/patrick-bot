const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserJob, getJobRequirements, updateLastWorked, updateUserData } = require('./economyUtils');

const PATRICK_COIN = '<:patrickcoin:1371211412940132492>';
const COOLDOWN = 10 * 60 * 1000; // 10 minutes in milliseconds

// Phrases for the typing game
const phrases = [
    "Krusty Krab pizza is the pizza for you and me!",
    "I'm ready! I'm ready! I'm ready!",
    "Who lives in a pineapple under the sea?",
    "The best time to wear a striped sweater is all the time!",
    "Is mayonnaise an instrument?",
    "The inner machinations of my mind are an enigma.",
    "I wumbo, you wumbo, he she me wumbo!",
    "F is for friends who do stuff together!",
    "This is a load of barnacles!",
    "I'm not a Krusty Krab!"
];

module.exports = {
    name: 'work',
    description: 'work your shift to earn coins',
    aliases: ['w'],
    async execute(message, client) {
        try {
            const userJob = await getUserJob(message.author.id);
            if (!userJob) {
                return message.reply("*you don't have a job! use pa apply [job] to get one!*");
            }

            // Check cooldown
            if (userJob.last_worked) {
                const lastWorked = new Date(userJob.last_worked);
                const timeLeft = COOLDOWN - (Date.now() - lastWorked.getTime());
                
                if (timeLeft > 0) {
                    const minutes = Math.ceil(timeLeft / 60000);
                    return message.reply(`*you need to wait ${minutes} more minutes before working again!*`);
                }
            }

            const jobReq = await getJobRequirements(userJob.job_name);
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s work')
                .setDescription(`*type this phrase to complete your shift:*\n\`${phrase}\``)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const workMsg = await message.reply({ embeds: [embed] });

            const filter = m => m.author.id === message.author.id;
            const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

            collector.on('collect', async (response) => {
                if (response.content.toLowerCase() === phrase.toLowerCase()) {
                    // Success
                    const userData = await getUserData(message.author.id);
                    userData.balance += jobReq.salary;
                    await updateUserData(message.author.id, userData);
                    await updateLastWorked(message.author.id);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle('patrick\'s work')
                        .setDescription(`*great job! you earned ${jobReq.salary} ${PATRICK_COIN} for your shift!*`)
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    message.reply({ embeds: [successEmbed] });
                } else {
                    // Failed
                    const failEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle('patrick\'s work')
                        .setDescription("*that's not quite right! try again later!*")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    message.reply({ embeds: [failEmbed] });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle('patrick\'s work')
                        .setDescription("*time's up! try again later!*")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    message.reply({ embeds: [timeoutEmbed] });
                }
            });
        } catch (error) {
            console.error('Error in work command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 