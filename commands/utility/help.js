const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'shows all available commands',
    aliases: ['h'],
    async execute(message, client) {
        try {
            // Get all command files
            const commands = [];
            const commandFolders = fs.readdirSync(path.join(__dirname, '..'));

            for (const folder of commandFolders) {
                const folderPath = path.join(__dirname, '..', folder);
                if (fs.statSync(folderPath).isDirectory()) {
                    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                    for (const file of commandFiles) {
                        const command = require(path.join(folderPath, file));
                        if (command.name) {
                            commands.push({
                                name: command.name,
                                description: command.description || 'No description available',
                                category: folder
                            });
                        }
                    }
                }
            }

            // Sort commands by category and name
            commands.sort((a, b) => {
                if (a.category === b.category) {
                    return a.name.localeCompare(b.name);
                }
                return a.category.localeCompare(b.category);
            });

            // Split commands into pages (9 commands per page)
            const commandsPerPage = 9;
            const pages = [];
            for (let i = 0; i < commands.length; i += commandsPerPage) {
                pages.push(commands.slice(i, i + commandsPerPage));
            }

            let currentPage = 0;

            // Create embed for current page
            const createEmbed = (page) => {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s commands')
                    .setDescription(
                        page.map(cmd => 
                            `**${cmd.name}**\n└ ${cmd.description}`
                        ).join('\n\n')
                    )
                    .setFooter({ 
                        text: `patrick • page ${currentPage + 1}/${pages.length} • ${commands.length} total commands`
                    })
                    .setTimestamp();

                return embed;
            };

            // Create navigation buttons
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
                            .setDisabled(currentPage === pages.length - 1),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('≫')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentPage === pages.length - 1)
                    );
            };

            // Send initial message
            const response = await message.reply({
                embeds: [createEmbed(pages[currentPage])],
                components: [createButtons()]
            });

            // Create collector for button interactions
            const collector = response.createMessageComponentCollector({
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "*this isn't your help menu!*",
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
                        currentPage = Math.min(pages.length - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = pages.length - 1;
                        break;
                }

                await interaction.update({
                    embeds: [createEmbed(pages[currentPage])],
                    components: [createButtons()]
                });
            });

            collector.on('end', () => {
                response.edit({
                    components: []
                }).catch(() => {});
            });
        } catch (error) {
            console.error('Error in help command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 