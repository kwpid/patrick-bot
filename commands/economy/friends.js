const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, getFriends, removeFriend } = require('../../utils/economyUtils');
const emojis = require('../../data/emojis.json');

module.exports = {
    name: 'friends',
    description: 'view your friends list',
    usage: 'pa friends',
    async execute(message, client) {
        try {
            const userData = await getUserData(message.author.id);
            if (!userData) {
                return message.reply("*you don't have an account yet!*");
            }

            const friends = await getFriends(message.author.id);
            
            if (friends.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${emojis.social} friends list`)
                    .setDescription("*you don't have any friends yet!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${emojis.social} friends list`)
                .setDescription(
                    friends.map(friend => {
                        const user = client.users.cache.get(friend.friend_id);
                        return `• ${user ? user.username : 'Unknown User'} (Level ${friend.level})`;
                    }).join('\n')
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const rows = [];
            for (let i = 0; i < friends.length; i += 5) {
                const friendRow = new ActionRowBuilder()
                    .addComponents(
                        ...friends.slice(i, i + 5).map(friend =>
                            new ButtonBuilder()
                                .setCustomId(`friend_remove_${friend.friend_id}`)
                                .setLabel(`Remove ${client.users.cache.get(friend.friend_id)?.username || 'Unknown'}`)
                                .setStyle(ButtonStyle.Danger)
                        )
                    );
                rows.push(friendRow);
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

                if (interaction.customId.startsWith('friend_remove_')) {
                    const friendId = interaction.customId.split('_')[2];
                    const result = await removeFriend(message.author.id, friendId);
                    
                    if (result.success) {
                        const updatedFriends = await getFriends(message.author.id);
                        
                        if (updatedFriends.length === 0) {
                            const emptyEmbed = new EmbedBuilder()
                                .setColor('#292929')
                                .setTitle(`${emojis.social} friends list`)
                                .setDescription("*you don't have any friends yet!*")
                                .setFooter({ text: 'patrick' })
                                .setTimestamp();

                            return interaction.update({ embeds: [emptyEmbed], components: [] });
                        }

                        const updatedEmbed = new EmbedBuilder()
                            .setColor('#292929')
                            .setTitle(`${emojis.social} friends list`)
                            .setDescription(
                                updatedFriends.map(friend => {
                                    const user = client.users.cache.get(friend.friend_id);
                                    return `• ${user ? user.username : 'Unknown User'} (Level ${friend.level})`;
                                }).join('\n')
                            )
                            .setFooter({ text: 'patrick' })
                            .setTimestamp();

                        const updatedRows = [];
                        for (let i = 0; i < updatedFriends.length; i += 5) {
                            const friendRow = new ActionRowBuilder()
                                .addComponents(
                                    ...updatedFriends.slice(i, i + 5).map(friend =>
                                        new ButtonBuilder()
                                            .setCustomId(`friend_remove_${friend.friend_id}`)
                                            .setLabel(`Remove ${client.users.cache.get(friend.friend_id)?.username || 'Unknown'}`)
                                            .setStyle(ButtonStyle.Danger)
                                    )
                                );
                            updatedRows.push(friendRow);
                        }

                        await interaction.update({ embeds: [updatedEmbed], components: updatedRows });
                    } else {
                        await interaction.reply({ content: result.message, ephemeral: true });
                    }
                }
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    const endEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${emojis.social} friends list`)
                        .setDescription("menu closed")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    response.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error executing friends command:', error);
            return message.reply('An error occurred while executing the friends command.');
        }
    }
}; 