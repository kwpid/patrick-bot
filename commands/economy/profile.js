const { EmbedBuilder } = require('discord.js');
const { getUserData, formatNumber, generateProgressBar } = require('../../utils/economyUtils');
const emojis = require('../../data/emojis.json');

module.exports = {
    name: 'profile',
    description: 'View your profile or another user\'s profile',
    usage: 'pa profile [@user]',
    aliases: ['p', 'stats'],
    async execute(message) {
        try {
            const target = message.mentions.users.first() || message.author;
            const userData = await getUserData(target.id);
            if (!userData) {
                return message.reply("*this user doesn't have an account yet!*");
            }

            const mainEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${target.username}'s profile`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `**Level:** ${userData.level}\n` +
                    `**XP:** ${userData.xp}/${userData.nextLevelXp}\n` +
                    `**Progress:** ${generateProgressBar(userData.xp, userData.nextLevelXp)}\n\n` +
                    `**Balance:** ${formatNumber(userData.balance)} ${emojis.coin}`
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            await message.reply({ embeds: [mainEmbed] });
        } catch (error) {
            console.error('Error executing profile command:', error);
            return message.reply('An error occurred while executing the profile command.');
        }
    }
};
