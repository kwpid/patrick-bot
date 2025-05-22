const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAllJobs, getUserData, getUserJob, formatNumber } = require('../../utils/economyUtils');
const { getJobRequirements } = require('../../utils/economyUtils');
const emojis = require ('../../data/emojis.json')

const JOBS_PER_PAGE = 5;

module.exports = {
    name: 'jobs',
    description: 'view available jobs',
    usage: 'pa jobs [category]',
    aliases: ['work'],
    args: [
        {
            name: 'category',
            type: 'option',
            description: 'filter jobs by category (optional)'
        }
    ],
    async execute(message, client) {
        try {
            const jobs = await getAllJobs();
            if (!jobs || jobs.length === 0) {
                return message.reply("no jobs are available right now");
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
                    .setTitle(`${message.author.username}'s Jobs`)
                    .setDescription(
                        pageJobs.map(job => {
                            const isAvailable = userData.level >= job.required_level;
                            const emoji = isAvailable ? emojis.checkmark : emojis.fail;
                    
                            let jobDisplay = `${emoji} **${job.job_name}**\n`;
                            jobDisplay += `├ Salary: ${formatNumber(job.salary)} ${emojis.coin} per shift\n`;
                            jobDisplay += `├ Required Level: ${job.required_level}\n`;
                            jobDisplay += `├ Minimum Shifts: ${job.min_shifts} per day\n`;
                            jobDisplay += `└ ID: \`${job.job_id}\``;
                    
                            if (userJob && userJob.job_name === job.job_name) {
                                jobDisplay += ' *(current job)*';
                            }
                    
                            return jobDisplay;
                        }).join('\n\n')
                    )
                    .setFooter({ 
                        text: `Page ${currentPage + 1}/${totalPages} • patrick • ${emojis.checkmark} = Available • ${emojis.fail} = Locked` 
                    })
                    
                    .setTimestamp();

                return embed;
            }

            const createButtons = () => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('≪')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('≫')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === totalPages - 1)
                    );
            };

            const response = await message.reply({
                embeds: [generateEmbed()],
                components: [createButtons()]
            });

            const collector = response.createMessageComponentCollector({
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "this isn't your jobs menu!",
                        ephemeral: true
                    });
                }

                switch (interaction.customId) {
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(totalPages - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = totalPages - 1;
                        break;
                }

                await interaction.update({
                    embeds: [generateEmbed()],
                    components: [createButtons()]
                });
            });

            collector.on('end', () => {
                response.edit({
                    components: []
                }).catch(() => {});
            });
        } catch (error) {
            console.error('Error in jobs command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 