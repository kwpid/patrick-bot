const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Define category display names and descriptions
const categories = {
    economy: {
        name: 'economy',
        description: 'commands for managing your patrickcoins and items'
    },
    utility: {
        name: 'utility',
        description: 'general utility commands'
    },
    fun: {
        name: 'fun',
        description: 'fun and entertainment commands'
    },
    admin: {
        name: 'admin',
        description: 'admin commands'
    }
};

// Define argument types and their descriptions
const argumentTypes = {
    user: 'mention a user',
    text: 'text input',
    number: 'a number',
    time: 'time duration (e.g., 1m, 2h, 3d)',
    option: 'one of the available options'
};

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
                                category: folder,
                                usage: command.usage || '',
                                args: command.args || [],
                                aliases: command.aliases || []
                            });
                        }
                    }
                }
            }

            // Group commands by category
            const categorizedCommands = {};
            for (const category in categories) {
                categorizedCommands[category] = commands.filter(cmd => cmd.category === category);
            }

            // Create pages for each category
            const pages = [];
            for (const category in categories) {
                const categoryCommands = categorizedCommands[category];
                if (categoryCommands.length === 0) continue;

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${categories[category].name} commands`)
                    .setDescription(categories[category].description)
                    .addFields(
                        categoryCommands.map(cmd => {
                            let fieldValue = cmd.description;
                            
                            // Add usage if available
                            if (cmd.usage) {
                                fieldValue += `\n└ Usage: \`${cmd.usage}\``;
                            }

                            // Add arguments if available
                            if (cmd.args && cmd.args.length > 0) {
                                fieldValue += '\n└ Arguments:';
                                cmd.args.forEach(arg => {
                                    fieldValue += `\n  ├ \`${arg.name}\` (${arg.type}) - ${arg.description}`;
                                });
                            }

                            // Add aliases if available
                            if (cmd.aliases && cmd.aliases.length > 0) {
                                fieldValue += `\n└ Aliases: \`${cmd.aliases.join(', ')}\``;
                            }

                            return {
                                name: `\`${cmd.name}\``,
                                value: fieldValue,
                                inline: false
                            };
                        })
                    )
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                pages.push(embed);
            }

            let currentPage = 0;

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
                embeds: [pages[currentPage]],
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
                    embeds: [pages[currentPage]],
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
