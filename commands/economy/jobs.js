const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAllJobs, getUserData, getUserJob, formatNumber } = require('./economyUtils');

const PATRICK_COIN = '<:patrickcoin:1371211412940132492>';
const JOBS_PER_PAGE = 5;

module.exports = {
    name: 'jobs',
    description: 'view all available jobs',
    aliases: ['joblist'],
    async execute(message, client) {
        try {
            const jobs = await getAllJobs();
            if (!jobs || jobs.length === 0) {
                return message.reply("*no jobs are available right now!*");
            }

            const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
            let currentPage = 0;

            const userData = await getUserData(message.author.id);
            const userJob = await getUserJob(message.author.id);

            function generateEmbed() {
                const start = currentPage * JOBS_PER_PAGE;
                const end = start + JOBS_PER_PAGE;
                const pageJobs = jobs.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s jobs')
                    .setDescription(
                        pageJobs.map(job => {
                            let jobDisplay = `**${job.job_name}**\n`;
                            jobDisplay += `├ Salary: ${formatNumber(job.salary)} ${PATRICK_COIN} per shift\n`;
                            jobDisplay += `├ Required Level: ${job.required_level}\n`;
                            jobDisplay += `└ ID: \`${job.job_id}\``;
                            
                            // Add indicators for current job and level requirement
                            if (userJob && userJob.job_name === job.job_name) {
                                jobDisplay += ' *(current job)*';
                            } else if (userData.level < job.required_level) {
                                jobDisplay += ' *(level too low)*';
                            }
                            
                            return jobDisplay;
                        }).join('\n\n')
                    )
                    .setFooter({ 
                        text: `Page ${currentPage + 1}/${totalPages} • patrick` 
                    })
                    .setTimestamp();

                return embed;
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('▶')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === totalPages - 1)
                );

            const response = await message.reply({
                embeds: [generateEmbed()],
                components: totalPages > 1 ? [row] : []
            });

            if (totalPages > 1) {
                const collector = response.createMessageComponentCollector({
                    time: 60000
                });

                collector.on('collect', async (interaction) => {
                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: "*this isn't your job list!*",
                            ephemeral: true
                        });
                    }

                    if (interaction.customId === 'prev') {
                        currentPage--;
                    } else if (interaction.customId === 'next') {
                        currentPage++;
                    }

                    row.components[0].setDisabled(currentPage === 0);
                    row.components[1].setDisabled(currentPage === totalPages - 1);

                    await interaction.update({
                        embeds: [generateEmbed()],
                        components: [row]
                    });
                });

                collector.on('end', () => {
                    row.components.forEach(button => button.setDisabled(true));
                    response.edit({ components: [row] }).catch(() => {});
                });
            }
        } catch (error) {
            console.error('Error in jobs command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 