const { Pool } = require('pg');
const { EmbedBuilder } = require('discord.js');

// Create a new pool using Railway's DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Message tracking for XP
const messageCounts = new Map();
const commandCounts = new Map();
const COOLDOWN_TIME = 60000; // 1 minute cooldown for command XP
const MESSAGE_XP_INTERVAL = 10; // XP every 10 messages
const COMMAND_XP_INTERVAL = 3; // XP every 3 commands
const MESSAGE_XP = 5; // XP per message interval
const COMMAND_XP = {
    min: 10,
    max: 15
};

// Test database connection
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database');
        client.release();
        return true;
    } catch (error) {
        console.error('Error connecting to PostgreSQL database:', error);
        return false;
    }
}

// Safely recreate shop table
async function recreateShopTable() {
    try {
        // Drop existing shop table if it exists
        await pool.query('DROP TABLE IF EXISTS shop CASCADE');
        
        // Create shop table with all necessary columns
        await pool.query(`
            CREATE TABLE shop (
                item_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                price INTEGER NOT NULL,
                emoji_id TEXT NOT NULL,
                tags TEXT[] NOT NULL,
                value INTEGER NOT NULL,
                type TEXT NOT NULL,
                on_sale BOOLEAN DEFAULT true,
                discount DECIMAL(3,2) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create index for faster queries
        await pool.query('CREATE INDEX IF NOT EXISTS shop_item_id_idx ON shop(item_id)');
        
        console.log('Shop table recreated successfully');
        return true;
    } catch (error) {
        console.error('Error recreating shop table:', error);
        return false;
    }
}

// Initialize shop items
async function initializeShopItems() {
    try {
        const shopItems = require('./shopItems.json').items;
        
        // Insert all items into shop table
        for (const item of shopItems) {
            await pool.query(
                `INSERT INTO shop (
                    item_id, name, description, price, emoji_id, 
                    tags, value, type, on_sale, discount
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (item_id) DO NOTHING`,
                [
                    item.id,
                    item.name,
                    item.description,
                    item.price,
                    item.emoji_id,
                    item.tags,
                    item.value,
                    item.type,
                    true,
                    0
                ]
            );
        }
        console.log('Shop items initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing shop items:', error);
        return false;
    }
}

// Initialize database tables
async function initializeDatabase() {
    try {
        // Test connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error('Failed to connect to database. Tables will not be created.');
            return;
        }

        // Create economy table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS economy (
                user_id TEXT PRIMARY KEY,
                balance INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                next_level_xp INTEGER DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create inventory table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                user_id TEXT,
                item_id TEXT,
                quantity INTEGER DEFAULT 1,
                PRIMARY KEY (user_id, item_id),
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES shop(item_id) ON DELETE CASCADE
            )
        `);

        // Recreate shop table
        await recreateShopTable();

        // Initialize shop items
        await initializeShopItems();

        // Create other indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS economy_user_id_idx ON economy(user_id);
            CREATE INDEX IF NOT EXISTS inventory_user_id_idx ON inventory(user_id);
            CREATE INDEX IF NOT EXISTS inventory_item_id_idx ON inventory(item_id);
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database tables:', error);
    }
}

// Call initialize on startup and log the result
initializeDatabase().then(() => {
    console.log('Database initialization completed');
}).catch(error => {
    console.error('Database initialization failed:', error);
});

// Default user data structure
const defaultUserData = {
    balance: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 100
};

// Get user data
async function getUserData(userId) {
    try {
        const result = await pool.query(
            'SELECT * FROM economy WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // Create new user data
            await pool.query(
                'INSERT INTO economy (user_id, balance, level, xp, next_level_xp) VALUES ($1, $2, $3, $4, $5)',
                [userId, defaultUserData.balance, defaultUserData.level, defaultUserData.xp, defaultUserData.nextLevelXp]
            );
            return defaultUserData;
        }

        return {
            balance: result.rows[0].balance,
            level: result.rows[0].level,
            xp: result.rows[0].xp,
            nextLevelXp: result.rows[0].next_level_xp
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        return defaultUserData;
    }
}

// Update user data
async function updateUserData(userId, newData) {
    try {
        await pool.query(
            `UPDATE economy 
             SET balance = $1, level = $2, xp = $3, next_level_xp = $4, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $5`,
            [newData.balance, newData.level, newData.xp, newData.nextLevelXp, userId]
        );
    } catch (error) {
        console.error('Error updating user data:', error);
    }
}

// Calculate XP needed for next level
function calculateNextLevelXp(currentLevel) {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

// Add XP to user and handle level up
async function addXp(userId, amount, message) {
    const userData = await getUserData(userId);
    const oldLevel = userData.level;
    userData.xp += amount;

    // Check for level up
    while (userData.xp >= userData.nextLevelXp) {
        userData.level += 1;
        userData.xp -= userData.nextLevelXp;
        userData.nextLevelXp = calculateNextLevelXp(userData.level);
        
        // Add coins for level up
        userData.balance += 100;
    }

    await updateUserData(userId, userData);

    // Send level up message if leveled up
    if (userData.level > oldLevel) {
        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle('Level Up!')
            .setDescription(`*${message.author.username} has reached level ${userData.level}!*\n*you earned 100 <:patrickcoin:1371211412940132492>!*`)
            .setFooter({ text: 'patrick' })
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    }

    return userData;
}

// Track message for XP
async function trackMessage(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const count = (messageCounts.get(userId) || 0) + 1;
    messageCounts.set(userId, count);

    if (count >= MESSAGE_XP_INTERVAL) {
        messageCounts.set(userId, 0);
        await addXp(userId, MESSAGE_XP, message);
    }
}

// Track command for XP
async function trackCommand(message) {
    const userId = message.author.id;
    const now = Date.now();
    const lastCommand = commandCounts.get(userId) || { count: 0, timestamp: 0 };

    // Reset count if cooldown has passed
    if (now - lastCommand.timestamp > COOLDOWN_TIME) {
        lastCommand.count = 0;
    }

    lastCommand.count++;
    lastCommand.timestamp = now;
    commandCounts.set(userId, lastCommand);

    if (lastCommand.count >= COMMAND_XP_INTERVAL) {
        lastCommand.count = 0;
        const xpAmount = Math.floor(Math.random() * (COMMAND_XP.max - COMMAND_XP.min + 1)) + COMMAND_XP.min;
        await addXp(userId, xpAmount, message);
    }
}

// Generate progress bar
function generateProgressBar(current, total, length = 10) {
    const progress = Math.floor((current / total) * length);
    let bar = '';
    
    for (let i = 0; i < length; i++) {
        if (i === 0) {
            bar += i < progress ? '<:left_start_filled:1366792481500299416>' : '<:left_start_empty:1366791939168403556>';
        } else if (i === length - 1) {
            bar += i < progress ? '<:right_end_filled:1366792357722198068>' : '<:right_end_empty:1366791994847789148>';
        } else {
            bar += i < progress ? '<:middle_filled:1366792454749294824>' : '<:middle_empty:1366791972651667579>';
        }
    }
    
    return bar;
}

// Inventory functions
async function getUserInventory(userId) {
    try {
        const result = await pool.query(
            `SELECT i.item_id, i.quantity, s.name, s.description, s.emoji_id, s.tags, s.price, s.value, s.type
             FROM inventory i
             JOIN shop s ON i.item_id = s.item_id
             WHERE i.user_id = $1
             ORDER BY s.name`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting user inventory:', error);
        return [];
    }
}

async function addItemToInventory(userId, itemId, quantity = 1) {
    try {
        await pool.query(
            `INSERT INTO inventory (user_id, item_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, item_id)
             DO UPDATE SET quantity = inventory.quantity + $3`,
            [userId, itemId, quantity]
        );
        return true;
    } catch (error) {
        console.error('Error adding item to inventory:', error);
        return false;
    }
}

async function removeItemFromInventory(userId, itemId, quantity = 1) {
    try {
        const result = await pool.query(
            `UPDATE inventory
             SET quantity = quantity - $3
             WHERE user_id = $1 AND item_id = $2 AND quantity >= $3
             RETURNING quantity`,
            [userId, itemId, quantity]
        );

        if (result.rows.length === 0) return false;

        // Delete the item if quantity becomes 0
        if (result.rows[0].quantity <= 0) {
            await pool.query(
                'DELETE FROM inventory WHERE user_id = $1 AND item_id = $2',
                [userId, itemId]
            );
        }

        return true;
    } catch (error) {
        console.error('Error removing item from inventory:', error);
        return false;
    }
}

// Shop functions
async function getShopItems() {
    try {
        const result = await pool.query(
            `SELECT * FROM shop
             WHERE on_sale = true
             ORDER BY price`
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting shop items:', error);
        return [];
    }
}

async function updateShopItems() {
    try {
        // Read shop items from JSON file
        const shopItems = require('./shopItems.json').items;
        
        // Clear current shop
        await pool.query('DELETE FROM shop');
        
        // Select 3-5 random items for the shop
        const numItems = Math.floor(Math.random() * 3) + 3; // Random number between 3-5
        const selectedItems = shopItems
            .sort(() => Math.random() - 0.5)
            .slice(0, numItems);
        
        // Add random discounts to some items (25% chance)
        const itemsWithDiscounts = selectedItems.map(item => {
            const hasDiscount = Math.random() < 0.25; // 25% chance of discount
            const discount = hasDiscount ? Math.random() * 0.3 + 0.1 : 0; // 10-40% discount
            return {
                ...item,
                discount: Math.round(discount * 100) / 100 // Round to 2 decimal places
            };
        });
        
        // Insert new items
        for (const item of itemsWithDiscounts) {
            await pool.query(
                `INSERT INTO shop (
                    item_id, name, description, price, emoji_id, 
                    tags, value, type, on_sale, discount
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    item.id, // Use the id from JSON as item_id
                    item.name,
                    item.description,
                    item.price,
                    item.emoji_id,
                    item.tags,
                    item.value,
                    item.type,
                    true, // Always set on_sale to true for shop items
                    item.discount
                ]
            );
        }
        return true;
    } catch (error) {
        console.error('Error updating shop items:', error);
        return false;
    }
}

module.exports = {
    getUserData,
    updateUserData,
    addXp,
    generateProgressBar,
    defaultUserData,
    trackMessage,
    trackCommand,
    getUserInventory,
    addItemToInventory,
    removeItemFromInventory,
    getShopItems,
    updateShopItems
}; 