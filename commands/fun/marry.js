const { EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');

// Create a new pool using Railway's DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize marriages table if it doesn't exist
async function initializeMarriagesTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS marriages (
                user_id VARCHAR(255) PRIMARY KEY,
                spouse_id VARCHAR(255) UNIQUE,
                marriage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (error) {
        console.error('Error initializing marriages table:', error);
    }
}

// Get marriage status
async function getMarriageStatus(userId) {
    try {
        const result = await pool.query(
            'SELECT * FROM marriages WHERE user_id = $1 OR spouse_id = $1',
            [userId]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error getting marriage status:', error);
        return null;
    }
}

// Create marriage request
async function createMarriageRequest(userId, targetId) {
    try {
        // Check if either user is already married
        const userMarriage = await getMarriageStatus(userId);
        const targetMarriage = await getMarriageStatus(targetId);
        
        if (userMarriage || targetMarriage) {
            return { success: false, message: "one of you is already married" };
        }

        // Create marriage request
        await pool.query(
            'INSERT INTO marriages (user_id, spouse_id) VALUES ($1, $2)',
            [userId, targetId]
        );
        
        return { success: true };
    } catch (error) {
        console.error('Error creating marriage request:', error);
        return { success: false, message: "something went wrong while creating the marriage request" };
    }
}

// Accept marriage request
async function acceptMarriageRequest(userId) {
    try {
        const result = await pool.query(
            'SELECT * FROM marriages WHERE spouse_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return { success: false, message: "you don't have any pending marriage requests" };
        }

        return { success: true, marriage: result.rows[0] };
    } catch (error) {
        console.error('Error accepting marriage request:', error);
        return { success: false, message: "something went wrong while accepting the marriage request" };
    }
}

// Decline marriage request
async function declineMarriageRequest(userId) {
    try {
        const result = await pool.query(
            'DELETE FROM marriages WHERE spouse_id = $1 RETURNING *',
            [userId]
        );

        if (result.rows.length === 0) {
            return { success: false, message: "you don't have any pending marriage requests" };
        }

        return { success: true };
    } catch (error) {
        console.error('Error declining marriage request:', error);
        return { success: false, message: "something went wrong while declining the marriage request!" };
    }
}

module.exports = {
    name: 'marry',
    description: 'marry another user or check marriage status',
    usage: 'pa marry [user/accept/decline/check]',
    aliases: ['marriage'],
    args: [
        {
            name: 'action',
            type: 'option',
            description: 'what to do (send request, accept, decline, or check status)'
        },
        {
            name: 'user',
            type: 'user',
            description: 'the user to marry or check status of (only needed for marry and check)'
        }
    ],
    async execute(message, client) {
        try {
            // Initialize marriages table
            await initializeMarriagesTable();

            const args = message.content.slice(6).trim().split(' ');
            const subcommand = args[0]?.toLowerCase();

            if (!subcommand) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("marriage help")
                    .setDescription(
                        "**commands**\n" +
                        "`pa marry [user]` - send a marriage request\n" +
                        "`pa marry accept` - accept a marriage request\n" +
                        "`pa marry decline` - decline a marriage request\n" +
                        "`pa marry check` - check your marriage status\n" +
                        "`pa marry check [user]` - check someone's marriage status"
                    )
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            if (subcommand === 'accept') {
                const result = await acceptMarriageRequest(message.author.id);
                
                if (!result.success) {
                    const embed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle("marriage request")
                        .setDescription(result.message)
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("marriage accepted")
                    .setDescription(`you are now married to <@${result.marriage.user_id}>!`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            if (subcommand === 'decline') {
                const result = await declineMarriageRequest(message.author.id);
                
                if (!result.success) {
                    const embed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle("marriage request")
                        .setDescription(result.message)
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("marriage request declined")
                    .setDescription("you have declined the marriage request.")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            if (subcommand === 'check') {
                const targetUser = message.mentions.users.first() || message.author;
                const marriage = await getMarriageStatus(targetUser.id);
                
                if (!marriage) {
                    const embed = new EmbedBuilder()
                        .setColor('#292929')
                        .setTitle("marriage status")
                        .setDescription(`${targetUser.id === message.author.id ? "you are" : `${targetUser.username} is`} not married.`)
                        .setFooter({ text: 'patrick' })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                }

                const spouseId = marriage.user_id === targetUser.id ? marriage.spouse_id : marriage.user_id;
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("marriage status")
                    .setDescription(`${targetUser.id === message.author.id ? "you are" : `${targetUser.username} is`} married to <@${spouseId}>!`)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Handle marriage request
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("marriage request")
                    .setDescription("please mention a user to send a marriage request")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            if (targetUser.id === message.author.id) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("marriage request")
                    .setDescription("you can't marry yourself")
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const result = await createMarriageRequest(message.author.id, targetUser.id);
            
            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#292929')
                    .setTitle("marriage request")
                    .setDescription(result.message)
                    .setFooter({ text: 'patrick' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle("marriage request sent")
                .setDescription(`you have sent a marriage request to ${targetUser.username}!\n\n*they can accept with \`pa marry accept\` or decline with \`pa marry decline\`*`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in marriage command:', error);
            message.reply("*something went wrong, try again later!*").catch(() => {});
        }
    }
}; 