const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Word scramble game
async function wordScrambleGame(message) {
    const words = [
        'krabby', 'patty', 'burger', 'fry', 'shake',
        'soda', 'drink', 'food', 'meal', 'lunch',
        'dinner', 'breakfast', 'snack', 'treat', 'dessert'
    ];
    
    const word = words[Math.floor(Math.random() * words.length)];
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    
    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle('patrick\'s word scramble')
        .setDescription(`*unscramble this word: ${scrambled}*`)
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    const msg = await message.reply({ embeds: [embed] });
    
    const filter = m => m.author.id === message.author.id;
    try {
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const answer = collected.first().content.toLowerCase();
        
        if (answer === word) {
            return { success: true, message: '*correct!*' };
        } else {
            return { success: false, message: `*wrong! the word was ${word}*` };
        }
    } catch (error) {
        return { success: false, message: '*time\'s up!*' };
    }
}

// Emoji memory game
async function emojiMemoryGame(message) {
    const emojis = ['🍔', '🍟', '🥤', '🍦', '🍕', '🌮', '🍿', '🍪', '🍩', '🍫'];
    const targetEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const embed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle('patrick\'s emoji memory')
        .setDescription(`*remember this emoji: ${targetEmoji}*`)
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    const msg = await message.reply({ embeds: [embed] });
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create buttons with random emojis
    const buttonEmojis = [...emojis].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!buttonEmojis.includes(targetEmoji)) {
        buttonEmojis[Math.floor(Math.random() * 4)] = targetEmoji;
    }
    
    const row = new ActionRowBuilder()
        .addComponents(
            buttonEmojis.map(emoji => 
                new ButtonBuilder()
                    .setCustomId(emoji)
                    .setLabel(emoji)
                    .setStyle(ButtonStyle.Primary)
            )
        );

    const gameEmbed = new EmbedBuilder()
        .setColor('#292929')
        .setTitle('patrick\'s emoji memory')
        .setDescription('*click the emoji you saw!*')
        .setFooter({ text: 'patrick' })
        .setTimestamp();

    await msg.edit({ embeds: [gameEmbed], components: [row] });

    try {
        const response = await msg.awaitMessageComponent({ time: 10000 });
        const success = response.customId === targetEmoji;
        await response.update({ components: [] });
        
        if (success) {
            return { success: true, message: '*correct!*' };
        } else {
            return { success: false, message: `*wrong! the emoji was ${targetEmoji}*` };
        }
    } catch (error) {
        await msg.edit({ components: [] });
        return { success: false, message: '*time\'s up!*' };
    }
}

// Select and run a random game
async function runRandomGame(message) {
    const games = [wordScrambleGame, emojiMemoryGame];
    const selectedGame = games[Math.floor(Math.random() * games.length)];
    return await selectedGame(message);
}

module.exports = {
    runRandomGame
}; 