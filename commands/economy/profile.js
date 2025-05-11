const { EmbedBuilder } = require('discord.js');
const { getUserData, getUserInventory } = require('./economyUtils');

module.exports = {
    name: 'profile',
    description: 'shows your or another user\'s profile',
    aliases: ['p'],
    async execute(message, client) {
        try {
            // Get target user (mentioned user or command author)
            const targetUser = message.mentions.users.first() || message.author;
            const userId = targetUser.id;

            const userData = await getUserData(userId);
            if (!userData) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle('patrick\'s profile')
                    .setDescription("*this user doesn't have an account yet!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const inventory = await getUserInventory(userId);
            const xpForNextLevel = Math.floor(100 * Math.pow(1.5, userData.level));
            const progress = (userData.xp / xpForNextLevel) * 100;
            const progressBar = createProgressBar(progress);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${targetUser.username}'s profile`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'level', value: `${userData.level}`, inline: true },
                    { name: 'xp', value: `${userData.xp}/${xpForNextLevel}`, inline: true },
                    { name: 'progress', value: progressBar, inline: false },
                    { name: 'balance', value: `${userData.balance} <:patrickcoin:1371211412940132492>`, inline: true },
                    { name: 'inventory', value: inventory.length > 0 ? 
                        inventory.map(item => `${item.emoji_id} ${item.name} (x${item.quantity})`).join('\n') : 
                        '*empty*', inline: false }
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in profile command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('patrick\'s profile')
                .setDescription("*something went wrong, try again later!*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
};

function createProgressBar(progress) {
    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.floor(progress)}%`;
} 