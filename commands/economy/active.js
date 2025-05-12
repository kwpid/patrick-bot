const { EmbedBuilder } = require('discord.js');
const { getActiveEffects } = require('../../utils/economyUtils');

module.exports = {
    name: 'active',
    description: 'view your active item effects',
    async execute(message, client) {
        try {
            const activeEffects = await getActiveEffects(message.author.id);

            if (activeEffects.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle(`${message.author.username}'s active effects`)
                    .setDescription("*you don't have any active effects right now!*")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle(`${message.author.username}'s Active Effects`)
                .setDescription(
                    activeEffects.map(effect => {
                        const timeLeft = Math.ceil((new Date(effect.expires_at) - Date.now()) / 1000 / 60);
                        let effectDescription;
                        switch (effect.effect_type) {
                            case 'xp_boost':
                                const boostPercent = Math.round((effect.effect_value - 1) * 100);
                                effectDescription = `+${boostPercent}% XP Boost`;
                                break;
                            default:
                                effectDescription = 'Unknown effect';
                        }
                        return `<:${effect.item_name.replace(/\s+/g, '')}:${effect.emoji_id}> **${effect.item_name}**\n` +
                               `├ Effect: ${effectDescription}\n` +
                               `└ Time Left: ${timeLeft} minutes`;
                    }).join('\n\n')
                )
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in active command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 