const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { 
    getUserData, 
    getFriends, 
    getPendingFriendRequests, 
    addFriend, 
    acceptFriendRequest, 
    removeFriend,
    giftItem,
    giftCoins,
    getUserInventory,
    formatNumber
} = require('../../utils/economyUtils');
const emojis = require('../../data/emojis.json');

module.exports = {
    name: 'social',
    description: 'access social features',
    usage: 'pa social',
    aliases: ['friends', 'guild'],
    async execute(message, client) {
        try {
            // Get user data
            const userData = await getUserData(message.author.id);
            if (!userData) {
                return message.reply("*you don't have an account yet!*");
            }

            // Create main menu embed
            const mainEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${emojis.social} social menu`)
                .setDescription(
                    "**Available Features:**\n" +
                    "• Friends List\n" +
                    "• Friend Requests\n" +
                    "• Gift Items/Coins\n" +
                    "• Guild Management\n\n" +
                    "*Select an option below to get started!*"
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            // Create main menu select
            const mainMenu = new StringSelectMenuBuilder()
                .setCustomId('social_menu')
                .setPlaceholder('Select a feature')
                .addOptions([
                    {
                        label: 'Friends List',
                        description: 'View and manage your friends',
                        value: 'friends',
                        emoji: '👥'
                    },
                    {
                        label: 'Friend Requests',
                        description: 'View and respond to friend requests',
                        value: 'requests',
                        emoji: '📨'
                    },
                    {
                        label: 'Gift Items/Coins',
                        description: 'Send gifts to your friends',
                        value: 'gift',
                        emoji: '🎁'
                    },
                    {
                        label: 'Guild Management',
                        description: 'Create or manage your guild',
                        value: 'guild',
                        emoji: '🏰'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(mainMenu);

            const response = await message.reply({
                embeds: [mainEmbed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "this isn't your menu",
                        ephemeral: true
                    });
                }

                if (interaction.customId === 'social_menu') {
                    const value = interaction.values[0];

                    switch (value) {
                        case 'friends':
                            await handleFriendsList(interaction);
                            break;
                        case 'requests':
                            await handleFriendRequests(interaction);
                            break;
                        case 'gift':
                            await handleGiftMenu(interaction);
                            break;
                        case 'guild':
                            await handleGuildMenu(interaction);
                            break;
                    }
                } else if (interaction.customId.startsWith('friend_')) {
                    const [action, friendId] = interaction.customId.split('_').slice(1);
                    switch (action) {
                        case 'accept':
                            await handleAcceptFriend(interaction, friendId);
                            break;
                        case 'decline':
                            await handleDeclineFriend(interaction, friendId);
                            break;
                        case 'remove':
                            await handleRemoveFriend(interaction, friendId);
                            break;
                    }
                } else if (interaction.customId.startsWith('gift_')) {
                    const [action, targetId] = interaction.customId.split('_').slice(1);
                    switch (action) {
                        case 'item':
                            await handleGiftItem(interaction, targetId);
                            break;
                        case 'coins':
                            await handleGiftCoins(interaction, targetId);
                            break;
                    }
                }
            });

            collector.on('end', () => {
                if (!response.deleted) {
                    const endEmbed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle(`${emojis.social} social menu`)
                        .setDescription("menu closed")
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();

                    response.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Error executing social command:', error);
            return message.reply('An error occurred while executing the social command.');
        }
    }
};

async function handleFriendsList(interaction) {
    const friends = await getFriends(interaction.user.id);
    
    if (friends.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`${emojis.social} friends list`)
            .setDescription("*you don't have any friends yet!*")
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        return interaction.update({ embeds: [embed], components: [] });
    }

    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} friends list`)
        .setDescription(
            friends.map(friend => {
                const user = interaction.client.users.cache.get(friend.friend_id);
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
                        .setLabel(`Remove ${interaction.client.users.cache.get(friend.friend_id)?.username || 'Unknown'}`)
                        .setStyle(ButtonStyle.Danger)
                )
            );
        rows.push(friendRow);
    }

    await interaction.update({ embeds: [embed], components: rows });
}

async function handleFriendRequests(interaction) {
    const requests = await getPendingFriendRequests(interaction.user.id);
    
    if (requests.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`${emojis.social} friend requests`)
            .setDescription("*you don't have any pending friend requests!*")
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        return interaction.update({ embeds: [embed], components: [] });
    }

    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} friend requests`)
        .setDescription(
            requests.map(request => {
                const user = interaction.client.users.cache.get(request.user_id);
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
                        .setLabel(`Accept ${interaction.client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`friend_decline_${request.user_id}`)
                        .setLabel(`Decline ${interaction.client.users.cache.get(request.user_id)?.username || 'Unknown'}`)
                        .setStyle(ButtonStyle.Danger)
                ]).flat()
            );
        rows.push(requestRow);
    }

    await interaction.update({ embeds: [embed], components: rows });
}

async function handleGiftMenu(interaction) {
    const friends = await getFriends(interaction.user.id);
    
    if (friends.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`${emojis.social} gift menu`)
            .setDescription("*you need friends to send gifts!*")
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        return interaction.update({ embeds: [embed], components: [] });
    }

    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} gift menu`)
        .setDescription("**Select a friend to send a gift to:**")
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    const rows = [];
    for (let i = 0; i < friends.length; i += 5) {
        const friendRow = new ActionRowBuilder()
            .addComponents(
                ...friends.slice(i, i + 5).map(friend => {
                    const user = interaction.client.users.cache.get(friend.friend_id);
                    return new ButtonBuilder()
                        .setCustomId(`gift_select_${friend.friend_id}`)
                        .setLabel(user ? user.username : 'Unknown')
                        .setStyle(ButtonStyle.Primary);
                })
            );
        rows.push(friendRow);
    }

    await interaction.update({ embeds: [embed], components: rows });
}

async function handleGuildMenu(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} guild menu`)
        .setDescription("*guild features coming soon!*")
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
}

async function handleAcceptFriend(interaction, friendId) {
    const result = await acceptFriendRequest(interaction.user.id, friendId);
    
    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} friend request`)
        .setDescription(result.message)
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
}

async function handleDeclineFriend(interaction, friendId) {
    const result = await removeFriend(interaction.user.id, friendId);
    
    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} friend request`)
        .setDescription(result.message)
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
}

async function handleRemoveFriend(interaction, friendId) {
    const result = await removeFriend(interaction.user.id, friendId);
    
    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} remove friend`)
        .setDescription(result.message)
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
}

async function handleGiftItem(interaction, targetId) {
    const inventory = await getUserInventory(interaction.user.id);
    
    if (inventory.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`${emojis.social} gift item`)
            .setDescription("*you don't have any items to gift!*")
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        return interaction.update({ embeds: [embed], components: [] });
    }

    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} gift item`)
        .setDescription("**Select an item to gift:**")
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    const rows = [];
    for (let i = 0; i < inventory.length; i += 5) {
        const itemRow = new ActionRowBuilder()
            .addComponents(
                ...inventory.slice(i, i + 5).map(item =>
                    new ButtonBuilder()
                        .setCustomId(`gift_item_${targetId}_${item.item_id}`)
                        .setLabel(`${item.name} (x${item.quantity})`)
                        .setStyle(ButtonStyle.Primary)
                )
            );
        rows.push(itemRow);
    }

    await interaction.update({ embeds: [embed], components: rows });
}

async function handleGiftCoins(interaction, targetId) {
    const userData = await getUserData(interaction.user.id);
    
    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle(`${emojis.social} gift coins`)
        .setDescription(
            `**Your Balance:** ${formatNumber(userData.balance)} ${emojis.coin}\n\n` +
            "*Enter the amount of coins you want to gift:*"
        )
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

    // Create a message collector for the amount
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async (message) => {
        const amount = parseInt(message.content);
        if (isNaN(amount) || amount <= 0) {
            return message.reply("*please enter a valid amount!*");
        }

        const result = await giftCoins(interaction.user.id, targetId, amount);
        
        const resultEmbed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle(`${emojis.social} gift coins`)
            .setDescription(result.message)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        await message.reply({ embeds: [resultEmbed] });
    });
} 