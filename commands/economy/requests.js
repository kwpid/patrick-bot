const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, getPendingFriendRequests, acceptFriendRequest, removeFriend } = require('../../utils/economyUtils');
const emojis = require('../../data/emojis.json');

module.exports = {
    name: 'requests',
    description: 'view and manage friend requests',
    usage: 'pa requests',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            if (!userData) {
                return message.reply("*you don't have an account yet!*");
            }

            const requests = await getPendingFriendRequests(message.author.id);
            
            if (requests.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${emojis.social} friend requests`)
                    .setDescription("*you don't have any pending friend requests!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${emojis.social} friend requests`)
                .setDescription(
                    requests.map(request => {
                        const user = client.users.cache.get(request.user_id);
                        return `• ${user ? user.username : 'Unknown User'} (Level ${request.level})`;
                    }).join('\n')
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const rows = [];
            for (let i = 0; i < requests.length; i += 5) {
                const requestRow = new ActionRowBuilder()
                    .addComponents(
                        ...requests.slice(i, i + 5).map(request => [
                            new ButtonBuilder()
                                .setCustomId(`friend_accept_${request.user_id}`)
                                .setLabel(`Accept ${client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`friend_decline_${request.user_id}`)
                                .setLabel(`Decline ${client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                                .setStyle(ButtonStyle.Danger)
                        ]).flat()
                    );
                rows.push(requestRow);
            }

            const response = await message.reply({ embeds: [embed], components: rows });

            const collector = response.createMessageComponentCollector({
                time: 300000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "this isn't your menu",
                        ephemeral: true
                    });
                }

                if (interaction.customId.startsWith('friend_')) {
                    const [action, friendId] = interaction.customId.split('_').slice(1);
                    
                    if (action === 'accept') {
                        const result = await acceptFriendRequest(message.author.id, friendId);
                        if (result.success) {
                            const updatedRequests = await getPendingFriendRequests(message.author.id);
                            
                            if (updatedRequests.length === 0) {
                                const emptyEmbed = new EmbedBuilder()
                                    .setColor('#292929')
                                    .setTitle(`${emojis.social} friend requests`)
                                    .setDescription("*you don't have any pending friend requests!*")
                                    .setFooter({ text: 'patrick' })
                                    .setTimestamp();

                                return interaction.update({ embeds: [emptyEmbed], components: [] });
                            }

                            const updatedEmbed = new EmbedBuilder()
                                .setColor('#292929')
                                .setTitle(`${emojis.social} friend requests`)
                                .setDescription(
                                    updatedRequests.map(request => {
                                        const user = client.users.cache.get(request.user_id);
                                        return `• ${user ? user.username : 'Unknown User'} (Level ${request.level})`;
                                    }).join('\n')
                                )
                                .setFooter({ text: 'patrick' })
                                .setTimestamp();

                            const updatedRows = [];
                            for (let i = 0; i < updatedRequests.length; i += 5) {
                                const requestRow = new ActionRowBuilder()
                                    .addComponents(
                                        ...updatedRequests.slice(i, i + 5).map(request => [
                                            new ButtonBuilder()
                                                .setCustomId(`friend_accept_${request.user_id}`)
                                                .setLabel(`Accept ${client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                                                .setStyle(ButtonStyle.Success),
                                            new ButtonBuilder()
                                                .setCustomId(`friend_decline_${request.user_id}`)
                                                .setLabel(`Decline ${client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                                                .setStyle(ButtonStyle.Danger)
                                        ]).flat()
                                    );
                                updatedRows.push(requestRow);
                            }

                            await interaction.update({ embeds: [updatedEmbed], components: updatedRows });
                        } else {
                            await interaction.reply({ content: result.message, ephemeral: true });
                        }
                    } else if (action === 'decline') {
                        const result = await removeFriend(message.author.id, friendId);
                        if (result.success) {
                            const updatedRequests = await getPendingFriendRequests(message.author.id);
                            
                            if (updatedRequests.length === 0) {
                                const emptyEmbed = new EmbedBuilder()
                                    .setColor('#292929')
                                    .setTitle(`${emojis.social} friend requests`)
                                    .setDescription("*you don't have any pending friend requests!*")
                                    .setFooter({ text: 'patrick' })
                                    .setTimestamp();

                                return interaction.update({ embeds: [emptyEmbed], components: [] });
                            }

                            const updatedEmbed = new EmbedBuilder()
                                .setColor('#292929')
                                .setTitle(`${emojis.social} friend requests`)
                                .setDescription(
                                    updatedRequests.map(request => {
                                        const user = client.users.cache.get(request.user_id);
                                        return `• ${user ? user.username : 'Unknown User'} (Level ${request.level})`;
                                    }).join('\n')
                                )
                                .setFooter({ text: 'patrick' })
                                .setTimestamp();

                            const updatedRows = [];
                            for (let i = 0; i < updatedRequests.length; i += 5) {
                                const requestRow = new ActionRowBuilder()
                                    .addComponents(
                                        ...updatedRequests.slice(i, i + 5).map(request => [
                                            new ButtonBuilder()
                                                .setCustomId(`friend_accept_${request.user_id}`)
                                                .setLabel(`Accept ${client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                                                .setStyle(ButtonStyle.Success),
                                            new ButtonBuilder()
                                                .setCustomId(`friend_decline_${request.user_id}`)
                                                .setLabel(`Decline ${client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                                                .setStyle(ButtonStyle.Danger)
                                        ]).flat()
                                    );
                                updatedRows.push(requestRow);
                            }

                            await interaction.update({ embeds: [updatedEmbed], components: updatedRows });
                        } else {
                            await interaction.reply({ content: result.message, ephemeral: true });
                        }
                    }
                }
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    const endEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${emojis.social} friend requests`)
                        .setDescription("menu closed")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    response.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error executing requests command:', error);
            return message.reply('An error occurred while executing the requests command.');
        }
    }
}; 