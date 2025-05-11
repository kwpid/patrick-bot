const { EmbedBuilder } = require('discord.js');
const { getUserData } = require('./economyUtils');

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

            const xpForNextLevel = Math.floor(100 * Math.pow(1.5, userData.level));
            const progress = (userData.xp / xpForNextLevel) * 100;
            const progressBar = createProgressBar(progress);

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${targetUser.username}'s Profile`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'level', value: `${userData.level}`, inline: false },
                    { name: 'progress', value: `${userData.xp}/${xpForNextLevel} XP\n${progressBar}`, inline: false },
                    { name: 'balance', value: `${userData.balance} <:patrickcoin:1371211412940132492>`, inline: false }
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
    
    // Left segment
    let bar = filled > 0 ? '<:left_filled:1366792481500299416>' : '<:left_empty:1366791939168403556>';
    
    // Middle segments
    if (filled > 1) {
        bar += '<:middle_filled:1366792454749294824>'.repeat(filled - 1);
    }
    if (empty > 1) {
        bar += '<:middle_empty:1366791972651667579>'.repeat(empty - 1);
    }
    
    // Right segment
    bar += filled === 10 ? '<:right_filled:1366792357722198068>' : '<:right_empty:1366791994847789148>';
    
    return bar;
} 