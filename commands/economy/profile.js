const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getUserData, getUserInventory, getUserJob, getJobRequirements, getFriends, formatNumber, generateProgressBar } = require('../../utils/economyUtils');
const emojis = require ('../../data/emojis.json')

module.exports = {
    name: 'profile',
    description: 'view your profile or another user\'s profile',
    usage: 'pa profile [@user]',
    aliases: ['p', 'stats'],
    async execute(message, client) {
        try {
            const target = message.mentions.users.first() || message.author;
            const userData = await getUserData(target.id);
            if (!userData) {
                return message.reply("*this user doesn't have an account yet!*");
            }

            const profileMenu = new StringSelectMenuBuilder()
                .setCustomId('profile_menu')
                .setPlaceholder('Select a view')
                .addOptions([
                    {
                        label: 'Main Profile',
                        description: 'View main profile information',
                        value: 'main',
                        emoji: '👤'
                    },
                    {
                        label: 'Friends List',
                        description: 'View friends list',
                        value: 'friends',
                        emoji: '👥'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(profileMenu);

            const mainEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${emojis.profile} ${target.username}'s profile`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `**Level:** ${userData.level}\n` +
                    `**XP:** ${userData.xp}/${userData.nextLevelXp}\n` +
                    `**Progress:** ${generateProgressBar(userData.xp, userData.nextLevelXp)}\n\n` +
                    `**Balance:** ${formatNumber(userData.balance)} ${emojis.coin}`
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            const response = await message.reply({
                embeds: [mainEmbed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                time: 300000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "this isn't your profile",
                        ephemeral: true
                    });
                }

                if (interaction.customId === 'profile_menu') {
                    const value = interaction.values[0];

                    if (value === 'main') {
                        await interaction.update({ embeds: [mainEmbed] });
                    } else if (value === 'friends') {
                        const friends = await getFriends(target.id);
                        
                        if (friends.length === 0) {
                            const friendsEmbed = new EmbedBuilder()
                                .setColor('#292929')
                                .setTitle(`${emojis.profile} ${target.username}'s friends`)
                                .setDescription("*no friends yet!*")
                                .setFooter({ text: 'patrick' })
                                .setTimestamp();

                            await interaction.update({ embeds: [friendsEmbed] });
                            return;
                        }

                        const friendsEmbed = new EmbedBuilder()
                            .setColor('#292929')
                            .setTitle(`${emojis.profile} ${target.username}'s friends`)
                            .setDescription(
                                friends.map(friend => {
                                    const user = client.users.cache.get(friend.friend_id);
                                    return `• ${user ? user.username : 'Unknown User'} (Level ${friend.level})`;
                                }).join('\n')
                            )
                            .setFooter({ text: 'patrick' })
                            .setTimestamp();

                        await interaction.update({ embeds: [friendsEmbed] });
                    }
                }
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    const endEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${emojis.profile} ${target.username}'s profile`)
                        .setDescription("menu closed")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    response.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error executing profile command:', error);
            return message.reply('An error occurred while executing the profile command.');
        }
    }
}; 
