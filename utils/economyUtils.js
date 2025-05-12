const { Pool } = require('pg');
const { EmbedBuilder } = require('discord.js');
const { chests } = require('../data/chests.json');

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
                effect_type TEXT,
                effect_value DECIMAL(4,2),
                effect_duration INTEGER,
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
        const shopItems = require('../data/shopItems.json').items;
        const chests = require('../data/chests.json').chests;
        
        // Insert all items into shop table
        for (const item of shopItems) {
            await pool.query(
                `INSERT INTO shop (
                    item_id, name, description, price, emoji_id, 
                    tags, value, type, on_sale, discount,
                    effect_type, effect_value, effect_duration
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
                    item.on_sale || true,
                    0,
                    item.effect?.type || null,
                    item.effect?.value || null,
                    item.effect?.duration || null
                ]
            );
        }

        // Add chests to shop table
        for (const [chestId, chestData] of Object.entries(chests)) {
            await pool.query(
                `INSERT INTO shop (
                    item_id, name, description, price, emoji_id, 
                    tags, value, type, on_sale, discount
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (item_id) DO NOTHING`,
                [
                    chestId,
                    chestData.name,
                    chestData.description,
                    1000, // Default price for chests
                    "1371269782808039524", // Default chest emoji
                    ["chest", "basic"],
                    500, // Default value
                    "chest",
                    false, // Chests are not for sale
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
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE
            )
        `);

        // Recreate shop table with new schema
        await recreateShopTable();

        // Create chests table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chests (
                chest_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                emoji_id TEXT NOT NULL
            )
        `);

        // Initialize chests if empty
        const chestCheck = await pool.query('SELECT COUNT(*) FROM chests');
        if (chestCheck.rows[0].count === '0') {
            const chests = require('../data/chests.json').chests;
            for (const [chestId, chestData] of Object.entries(chests)) {
                await pool.query(
                    `INSERT INTO chests (chest_id, name, description, emoji_id)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (chest_id) DO NOTHING`,
                    [
                        chestId,
                        chestData.name,
                        chestData.description,
                        "1371269782808039524" // Default chest emoji
                    ]
                );
            }
        }

        // Initialize shop items
        await initializeShopItems();

        // Create jobs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                user_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                job_name TEXT NOT NULL,
                last_worked TIMESTAMP,
                last_quit_time TIMESTAMP,
                daily_shifts INTEGER DEFAULT 0,
                last_shift_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES job_requirements(job_id) ON DELETE CASCADE
            )
        `);

        // Create job requirements table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_requirements (
                job_id TEXT PRIMARY KEY,
                job_name TEXT NOT NULL,
                required_level INTEGER NOT NULL,
                salary INTEGER NOT NULL,
                min_shifts INTEGER NOT NULL DEFAULT 3
            )
        `);

        // Initialize job requirements if empty
        const jobCheck = await pool.query('SELECT COUNT(*) FROM job_requirements');
        if (jobCheck.rows[0].count === '0') {
            const jobs = [
                ['lemonade_booth', 'Lemonade Booth', 0, 200, 2],
                ['chum_janitor', 'Chum Bucket Janitor', 3, 350, 3],
                ['shake_server', 'Kelp Shake Server', 5, 500, 3],
                ['boating_assistant', 'Boating School Assistant', 8, 650, 4],
                ['jelly_harvester', 'Jellyfish Jelly Harvester', 11, 800, 4],
                ['goo_lifeguard', 'Lifeguard at Goo Lagoon', 14, 1000, 4],
                ['lab_assistant', 'Sandy\'s Lab Assistant', 17, 1200, 5],
                ['tour_guide', 'Atlantis Tour Guide', 21, 1500, 5],
                ['krab_manager', 'Krusty Krab Manager', 25, 1800, 6],
                ['krab_owner', 'Krusty Krab Owner', 30, 2500, 6]
            ];

            for (const [id, name, level, salary, minShifts] of jobs) {
                await pool.query(
                    'INSERT INTO job_requirements (job_id, job_name, required_level, salary, min_shifts) VALUES ($1, $2, $3, $4, $5)',
                    [id, name, level, salary, minShifts]
                );
            }
        }

        // Create other indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS economy_user_id_idx ON economy(user_id);
            CREATE INDEX IF NOT EXISTS inventory_user_id_idx ON inventory(user_id);
            CREATE INDEX IF NOT EXISTS inventory_item_id_idx ON inventory(item_id);
        `);

        // Create active effects table
        await createActiveEffectsTable();

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database tables:', error);
    }
}

// Add missing columns to existing tables
async function addMissingColumns() {
    try {
        // Check if discount column exists in shop table
        const shopColumnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'shop' 
            AND column_name = 'discount'
        `);

        // If discount column doesn't exist, add it
        if (shopColumnCheck.rows.length === 0) {
            await pool.query(`
                ALTER TABLE shop 
                ADD COLUMN discount DECIMAL(3,2) DEFAULT 0
            `);
            console.log('Added discount column to shop table');
        }

        // Check if daily_shifts column exists in jobs table
        const jobsColumnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
            AND column_name IN ('daily_shifts', 'last_shift_reset')
        `);

        const existingColumns = jobsColumnCheck.rows.map(row => row.column_name);

        // Add daily_shifts if it doesn't exist
        if (!existingColumns.includes('daily_shifts')) {
            await pool.query(`
                ALTER TABLE jobs 
                ADD COLUMN daily_shifts INTEGER DEFAULT 0
            `);
            console.log('Added daily_shifts column to jobs table');
        }

        // Add last_shift_reset if it doesn't exist
        if (!existingColumns.includes('last_shift_reset')) {
            await pool.query(`
                ALTER TABLE jobs 
                ADD COLUMN last_shift_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('Added last_shift_reset column to jobs table');
        }

        // Check if min_shifts column exists in job_requirements table
        const jobReqColumnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_requirements' 
            AND column_name = 'min_shifts'
        `);

        // Add min_shifts if it doesn't exist
        if (jobReqColumnCheck.rows.length === 0) {
            await pool.query(`
                ALTER TABLE job_requirements 
                ADD COLUMN min_shifts INTEGER NOT NULL DEFAULT 3
            `);
            console.log('Added min_shifts column to job_requirements table');

            // Update existing jobs with default min_shifts values
            const jobs = [
                ['lemonade_booth', 2],
                ['chum_janitor', 3],
                ['shake_server', 3],
                ['boating_assistant', 4],
                ['jelly_harvester', 4],
                ['goo_lifeguard', 4],
                ['lab_assistant', 5],
                ['tour_guide', 5],
                ['krab_manager', 6],
                ['krab_owner', 6]
            ];

            for (const [jobId, minShifts] of jobs) {
                await pool.query(
                    'UPDATE job_requirements SET min_shifts = $1 WHERE job_id = $2',
                    [minShifts, jobId]
                );
            }
            console.log('Updated existing jobs with min_shifts values');
        }

        return true;
    } catch (error) {
        console.error('Error adding missing columns:', error);
        return false;
    }
}

// Call initialize on startup and log the result
initializeDatabase().then(async () => {
    console.log('Database initialization completed');
    // Add any missing columns
    await addMissingColumns();
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
            // Create new user data with validated values
            const defaultData = {
                balance: 0,
                level: 1,
                xp: 0,
                nextLevelXp: 100
            };
            await pool.query(
                'INSERT INTO economy (user_id, balance, level, xp, next_level_xp) VALUES ($1, $2, $3, $4, $5)',
                [userId, defaultData.balance, defaultData.level, defaultData.xp, defaultData.nextLevelXp]
            );
            return defaultData;
        }

        // Ensure level is at least 1 and XP is non-negative
        const level = Math.max(1, parseInt(result.rows[0].level) || 1);
        const xp = Math.max(0, parseInt(result.rows[0].xp) || 0);
        const nextLevelXp = Math.max(100, parseInt(result.rows[0].next_level_xp) || 100);

        // If the data is invalid, fix it
        if (level !== parseInt(result.rows[0].level) || xp !== parseInt(result.rows[0].xp) || nextLevelXp !== parseInt(result.rows[0].next_level_xp)) {
            await pool.query(
                'UPDATE economy SET level = $1, xp = $2, next_level_xp = $3 WHERE user_id = $4',
                [level, xp, nextLevelXp, userId]
            );
        }

        return {
            balance: parseInt(result.rows[0].balance) || 0,
            level: level,
            xp: xp,
            nextLevelXp: nextLevelXp
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
}

// Update user data
async function updateUserData(userId, newData) {
    try {
        // Get current data to ensure we don't accidentally reset values
        const currentData = await getUserData(userId);
        
        // Validate and merge data
        const validatedData = {
            balance: Math.max(0, Math.floor(newData.balance)) || currentData.balance,
            level: Math.max(1, Math.floor(newData.level)) || currentData.level,
            xp: Math.max(0, Math.floor(newData.xp)) || currentData.xp,
            nextLevelXp: Math.max(100, Math.floor(newData.nextLevelXp)) || currentData.nextLevelXp
        };

        // Ensure level progression is valid
        if (validatedData.level < currentData.level) {
            console.error('Attempted to set level lower than current level:', {
                userId,
                currentLevel: currentData.level,
                attemptedLevel: validatedData.level
            });
            validatedData.level = currentData.level;
        }

        // Update the database with validated data
        await pool.query(
            `UPDATE economy 
             SET balance = $1, level = $2, xp = $3, next_level_xp = $4, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $5`,
            [validatedData.balance, validatedData.level, validatedData.xp, validatedData.nextLevelXp, userId]
        );
        return true;
    } catch (error) {
        console.error('Error updating user data:', error);
        return false;
    }
}

// Calculate XP needed for next level
function calculateNextLevelXp(currentLevel) {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

// Add XP to user and handle level up
async function addXp(userId, amount, message = null) {
    try {
        // Get active XP boost if any
        const activeEffects = await pool.query(
            `SELECT effect_value 
             FROM active_effects 
             WHERE user_id = $1 
             AND effect_type = 'xp_boost' 
             AND expires_at > CURRENT_TIMESTAMP`,
            [userId]
        );

        // Apply XP boost if active
        let finalAmount = amount;
        if (activeEffects.rows.length > 0) {
            const boost = activeEffects.rows[0].effect_value;
            finalAmount = Math.floor(amount * boost);
        }

        // Get current user data
        const result = await pool.query(
            'SELECT * FROM economy WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // Create new user entry
            await pool.query(
                `INSERT INTO economy (user_id, xp, next_level_xp)
                 VALUES ($1, $2, $3)`,
                [userId, finalAmount, 100]
            );
            return;
        }

        const userData = result.rows[0];
        const newXp = userData.xp + finalAmount;
        let newLevel = userData.level;
        let nextLevelXp = userData.next_level_xp;

        // Check for level up
        while (newXp >= nextLevelXp) {
            newLevel++;
            nextLevelXp = Math.floor(nextLevelXp * 1.5); // Increase XP needed for next level
        }

        // Update user data
        await pool.query(
            `UPDATE economy 
             SET xp = $1, level = $2, next_level_xp = $3, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $4`,
            [newXp, newLevel, nextLevelXp, userId]
        );

        // Send level up message if applicable
        if (newLevel > userData.level && message) {
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('Level Up!')
                .setDescription(`*${message.author.username} has reached level ${newLevel}!*`)
                .setFooter({ text: 'patrick' })
                .setTimestamp();

            message.channel.send({ embeds: [levelUpEmbed] }).catch(() => {});
        }

        return {
            xp: newXp,
            level: newLevel,
            nextLevelXp: nextLevelXp,
            xpGained: finalAmount,
            boosted: activeEffects.rows.length > 0
        };
    } catch (error) {
        console.error('Error adding XP:', error);
        return null;
    }
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
            bar += i < progress ? '<:left_filled:1366792481500299416>' : '<:left_empty:1366791939168403556>';
        } else if (i === length - 1) {
            bar += i < progress ? '<:right_filled:1366792357722198068>' : '<:right_empty:1366791994847789148>';
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
        // Check if it's a chest
        const chestCheck = await pool.query(
            'SELECT chest_id FROM chests WHERE chest_id = $1',
            [itemId]
        );

        if (chestCheck.rows.length > 0) {
            // It's a chest, add directly to inventory
            await pool.query(
                `INSERT INTO inventory (user_id, item_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, item_id)
                 DO UPDATE SET quantity = inventory.quantity + $3`,
                [userId, itemId, quantity]
            );
            return true;
        }

        // Check if it's a shop item
        const itemCheck = await pool.query(
            'SELECT item_id FROM shop WHERE item_id = $1',
            [itemId]
        );

        if (itemCheck.rows.length === 0) {
            console.error('Item not found in shop or chests:', itemId);
            return false;
        }

        // Add to inventory
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
             AND type != 'chest'
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
        const shopItems = require('../data/shopItems.json').items.filter(item => item.type !== 'chest');
        
        // Select 3-5 random items for the shop
        const numItems = Math.floor(Math.random() * 3) + 3; // Random number between 3-5
        const selectedItems = shopItems
            .sort(() => Math.random() - 0.5)
            .slice(0, numItems);
        
        // First, set all items to not be on sale
        await pool.query('UPDATE shop SET on_sale = false');
        
        // Insert or update the selected items
        for (const item of selectedItems) {
            await pool.query(
                `INSERT INTO shop (
                    item_id, name, description, price, emoji_id, 
                    tags, value, type, on_sale
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (item_id) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    emoji_id = EXCLUDED.emoji_id,
                    tags = EXCLUDED.tags,
                    value = EXCLUDED.value,
                    type = EXCLUDED.type,
                    on_sale = EXCLUDED.on_sale,
                    last_updated = CURRENT_TIMESTAMP`,
                [
                    item.id,
                    item.name,
                    item.description,
                    item.price,
                    item.emoji_id,
                    item.tags,
                    item.value,
                    item.type,
                    true
                ]
            );
        }

        // Verify that items were added
        const verifyResult = await pool.query(
            'SELECT COUNT(*) FROM shop WHERE on_sale = true'
        );
        
        if (parseInt(verifyResult.rows[0].count) === 0) {
            console.error('No items were added to the shop after update');
            // If no items were added, try to add them again without the update
            for (const item of selectedItems) {
                await pool.query(
                    `INSERT INTO shop (
                        item_id, name, description, price, emoji_id, 
                        tags, value, type, on_sale
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT DO NOTHING`,
                    [
                        item.id,
                        item.name,
                        item.description,
                        item.price,
                        item.emoji_id,
                        item.tags,
                        item.value,
                        item.type,
                        true
                    ]
                );
            }
        }

        return true;
    } catch (error) {
        console.error('Error updating shop items:', error);
        return false;
    }
}

// Job-related functions
async function getUserJob(userId) {
    try {
        const result = await pool.query(
            `SELECT j.*, jr.salary 
             FROM jobs j 
             JOIN job_requirements jr ON j.job_id = jr.job_id 
             WHERE j.user_id = $1`,
            [userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error getting user job:', error);
        return null;
    }
}

async function setUserJob(userId, jobId) {
    try {
        if (jobId === null) {
            // Handle quitting job
            await pool.query(
                'DELETE FROM jobs WHERE user_id = $1',
                [userId]
            );
            return true;
        }

        // Handle getting a new job
        const jobReq = await getJobRequirements(jobId);
        if (!jobReq) {
            return false;
        }
        await pool.query(
            'INSERT INTO jobs (user_id, job_id, job_name) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET job_id = $2, job_name = $3',
            [userId, jobId, jobReq.job_name]
        );
        return true;
    } catch (error) {
        console.error('Error setting user job:', error);
        return false;
    }
}

async function updateLastWorked(userId) {
    try {
        await pool.query(
            'UPDATE jobs SET last_worked = CURRENT_TIMESTAMP WHERE user_id = $1',
            [userId]
        );
        return true;
    } catch (error) {
        console.error('Error updating last worked:', error);
        return false;
    }
}

async function getJobRequirements(jobId) {
    try {
        console.log('Getting job requirements for job ID:', jobId);
        const result = await pool.query(
            'SELECT * FROM job_requirements WHERE job_id = $1',
            [jobId]
        );
        console.log('Query result:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('Error getting job requirements:', error);
        return null;
    }
}

async function getAllJobs() {
    try {
        const result = await pool.query('SELECT * FROM job_requirements ORDER BY required_level');
        return result.rows;
    } catch (error) {
        console.error('Error getting all jobs:', error);
        return [];
    }
}

// Safely recreate job requirements table
async function recreateJobRequirementsTable() {
    try {
        console.log('Starting job requirements table recreation...');
        
        // Drop existing job requirements table if it exists
        await pool.query('DROP TABLE IF EXISTS job_requirements CASCADE');
        console.log('Dropped existing job_requirements table');
        
        // Create job requirements table
        await pool.query(`
            CREATE TABLE job_requirements (
                job_id TEXT PRIMARY KEY,
                job_name TEXT NOT NULL,
                required_level INTEGER NOT NULL,
                salary INTEGER NOT NULL,
                min_shifts INTEGER NOT NULL DEFAULT 3
            )
        `);
        console.log('Created new job_requirements table');

        // Initialize job requirements
        const jobs = [
            ['lemonade_booth', 'Lemonade Booth', 0, 200, 2],
            ['chum_janitor', 'Chum Bucket Janitor', 3, 350, 3],
            ['shake_server', 'Kelp Shake Server', 5, 500, 3],
            ['boating_assistant', 'Boating School Assistant', 8, 650, 4],
            ['jelly_harvester', 'Jellyfish Jelly Harvester', 11, 800, 4],
            ['goo_lifeguard', 'Lifeguard at Goo Lagoon', 14, 1000, 4],
            ['lab_assistant', 'Sandy\'s Lab Assistant', 17, 1200, 5],
            ['tour_guide', 'Atlantis Tour Guide', 21, 1500, 5],
            ['krab_manager', 'Krusty Krab Manager', 25, 1800, 6],
            ['krab_owner', 'Krusty Krab Owner', 30, 2500, 6]
        ];

        console.log('Inserting jobs into job_requirements table...');
        for (const [id, name, level, salary, minShifts] of jobs) {
            await pool.query(
                'INSERT INTO job_requirements (job_id, job_name, required_level, salary, min_shifts) VALUES ($1, $2, $3, $4, $5)',
                [id, name, level, salary, minShifts]
            );
            console.log(`Inserted job: ${id} (${name})`);
        }

        // Verify the jobs were inserted
        const verifyResult = await pool.query('SELECT * FROM job_requirements');
        console.log('Verification - Jobs in table:', verifyResult.rows);
        
        console.log('Job requirements table recreated successfully');
        return true;
    } catch (error) {
        console.error('Error recreating job requirements table:', error);
        return false;
    }
}

// Safely recreate jobs table
async function recreateJobsTable() {
    try {
        // Drop existing jobs table if it exists
        await pool.query('DROP TABLE IF EXISTS jobs CASCADE');
        
        // Create jobs table
        await pool.query(`
            CREATE TABLE jobs (
                user_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                job_name TEXT NOT NULL,
                last_worked TIMESTAMP,
                last_quit_time TIMESTAMP,
                daily_shifts INTEGER DEFAULT 0,
                last_shift_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES job_requirements(job_id) ON DELETE CASCADE
            )
        `);
        
        console.log('Jobs table recreated successfully');
        return true;
    } catch (error) {
        console.error('Error recreating jobs table:', error);
        return false;
    }
}

// Format number to readable format (e.g., 1.0K, 10.0K, 100.0K, 1.0M, etc.)
function formatNumber(num) {
    const units = ['', 'K', 'M', 'B', 'T'];
    const k = 1000;
    const magnitude = Math.floor(Math.log(num) / Math.log(k));
    
    if (magnitude === 0) return num.toString();
    
    const scaled = num / Math.pow(k, magnitude);
    const formatted = scaled.toFixed(1);
    return formatted.replace(/\.0$/, '') + units[magnitude];
}

// Safely recreate all tables
async function recreateAllTables() {
    try {
        // Drop tables in correct order to handle dependencies
        await pool.query('DROP TABLE IF EXISTS inventory CASCADE');
        await pool.query('DROP TABLE IF EXISTS jobs CASCADE');
        await pool.query('DROP TABLE IF EXISTS job_requirements CASCADE');
        await pool.query('DROP TABLE IF EXISTS shop CASCADE');
        await pool.query('DROP TABLE IF EXISTS economy CASCADE');
        await pool.query('DROP TABLE IF EXISTS chests CASCADE');

        // Recreate tables in correct order
        await pool.query(`
            CREATE TABLE economy (
                user_id TEXT PRIMARY KEY,
                balance INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                next_level_xp INTEGER DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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
                effect_type TEXT,
                effect_value DECIMAL(4,2),
                effect_duration INTEGER,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE chests (
                chest_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                emoji_id TEXT NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE inventory (
                user_id TEXT,
                item_id TEXT,
                quantity INTEGER DEFAULT 1,
                PRIMARY KEY (user_id, item_id),
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE job_requirements (
                job_id TEXT PRIMARY KEY,
                job_name TEXT NOT NULL,
                required_level INTEGER NOT NULL,
                salary INTEGER NOT NULL,
                min_shifts INTEGER NOT NULL DEFAULT 3
            )
        `);

        await pool.query(`
            CREATE TABLE jobs (
                user_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                job_name TEXT NOT NULL,
                last_worked TIMESTAMP,
                last_quit_time TIMESTAMP,
                daily_shifts INTEGER DEFAULT 0,
                last_shift_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES job_requirements(job_id) ON DELETE CASCADE
            )
        `);

        // Initialize shop items
        const shopItems = require('../data/shopItems.json').items;
        for (const item of shopItems) {
            await pool.query(
                `INSERT INTO shop (
                    item_id, name, description, price, emoji_id, 
                    tags, value, type, on_sale, discount,
                    effect_type, effect_value, effect_duration
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
                    item.on_sale || true,
                    0,
                    item.effect?.type || null,
                    item.effect?.value || null,
                    item.effect?.duration || null
                ]
            );
        }

        // Initialize chests
        const chests = require('../data/chests.json').chests;
        for (const [chestId, chestData] of Object.entries(chests)) {
            await pool.query(
                `INSERT INTO chests (chest_id, name, description, emoji_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (chest_id) DO NOTHING`,
                [
                    chestId,
                    chestData.name,
                    chestData.description,
                    "1371269782808039524" // Default chest emoji
                ]
            );
        }

        // Initialize job requirements
        const jobs = [
            ['lemonade_booth', 'Lemonade Booth', 0, 200, 2],
            ['chum_janitor', 'Chum Bucket Janitor', 3, 350, 3],
            ['shake_server', 'Kelp Shake Server', 5, 500, 3],
            ['boating_assistant', 'Boating School Assistant', 8, 650, 4],
            ['jelly_harvester', 'Jellyfish Jelly Harvester', 11, 800, 4],
            ['goo_lifeguard', 'Lifeguard at Goo Lagoon', 14, 1000, 4],
            ['lab_assistant', 'Sandy\'s Lab Assistant', 17, 1200, 5],
            ['tour_guide', 'Atlantis Tour Guide', 21, 1500, 5],
            ['krab_manager', 'Krusty Krab Manager', 25, 1800, 6],
            ['krab_owner', 'Krusty Krab Owner', 30, 2500, 6]
        ];

        for (const [id, name, level, salary, minShifts] of jobs) {
            await pool.query(
                'INSERT INTO job_requirements (job_id, job_name, required_level, salary, min_shifts) VALUES ($1, $2, $3, $4, $5)',
                [id, name, level, salary, minShifts]
            );
        }

        console.log('All tables recreated successfully');
        return true;
    } catch (error) {
        console.error('Error recreating tables:', error);
        return false;
    }
}

// Replace the in-memory cooldown functions with database functions
async function getLastQuitTime(userId) {
    try {
        const result = await pool.query(
            'SELECT last_quit_time FROM jobs WHERE user_id = $1',
            [userId]
        );
        return result.rows[0]?.last_quit_time || null;
    } catch (error) {
        console.error('Error getting last quit time:', error);
        return null;
    }
}

async function setLastQuitTime(userId, timestamp) {
    try {
        await pool.query(
            'UPDATE jobs SET last_quit_time = $1 WHERE user_id = $2',
            [new Date(timestamp), userId]
        );
        return true;
    } catch (error) {
        console.error('Error setting last quit time:', error);
        return false;
    }
}

// Add new functions for shift management
async function incrementDailyShifts(userId) {
    try {
        await pool.query(
            'UPDATE jobs SET daily_shifts = daily_shifts + 1 WHERE user_id = $1',
            [userId]
        );
        return true;
    } catch (error) {
        console.error('Error incrementing daily shifts:', error);
        return false;
    }
}

async function resetDailyShifts() {
    try {
        const now = new Date();
        const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        
        // Only reset if it's midnight EST
        if (est.getHours() === 0 && est.getMinutes() === 0) {
            // Get all jobs and check minimum shifts
            const result = await pool.query(`
                SELECT j.user_id, j.job_id, j.job_name, j.daily_shifts, jr.min_shifts
                FROM jobs j
                JOIN job_requirements jr ON j.job_id = jr.job_id
                WHERE j.last_shift_reset < CURRENT_DATE
            `);

            for (const job of result.rows) {
                // 70% chance of getting fired if minimum shifts not met
                if (job.daily_shifts < job.min_shifts && Math.random() < 0.7) {
                    await setUserJob(job.user_id, null);
                    // Notify user (you'll need to implement this)
                    console.log(`User ${job.user_id} was fired from ${job.job_name} for not meeting minimum shifts`);
                }
            }

            // Reset shifts for all jobs
            await pool.query(`
                UPDATE jobs 
                SET daily_shifts = 0, 
                    last_shift_reset = CURRENT_TIMESTAMP 
                WHERE last_shift_reset < CURRENT_DATE
            `);
        }
        return true;
    } catch (error) {
        console.error('Error resetting daily shifts:', error);
        return false;
    }
}

// Create active effects table
async function createActiveEffectsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS active_effects (
                user_id TEXT,
                item_id TEXT,
                effect_type TEXT NOT NULL,
                effect_value DECIMAL(5,2) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, item_id),
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE
            )
        `);
        console.log('Active effects table created successfully');
        return true;
    } catch (error) {
        console.error('Error creating active effects table:', error);
        return false;
    }
}

// Add active effect
async function addActiveEffect(userId, itemId, effectType, effectValue, durationMinutes) {
    try {
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
        await pool.query(
            `INSERT INTO active_effects (user_id, item_id, effect_type, effect_value, expires_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, item_id) 
             DO UPDATE SET 
                effect_type = EXCLUDED.effect_type,
                effect_value = EXCLUDED.effect_value,
                expires_at = EXCLUDED.expires_at,
                created_at = CURRENT_TIMESTAMP`,
            [userId, itemId, effectType, effectValue, expiresAt]
        );
        return true;
    } catch (error) {
        console.error('Error adding active effect:', error);
        return false;
    }
}

// Get active effects for user
async function getActiveEffects(userId) {
    try {
        // First, clean up expired effects
        await pool.query(
            'DELETE FROM active_effects WHERE expires_at < CURRENT_TIMESTAMP'
        );

        // Then get active effects
        const result = await pool.query(
            `SELECT ae.*, s.name as item_name, s.emoji_id
             FROM active_effects ae
             JOIN shop s ON ae.item_id = s.item_id
             WHERE ae.user_id = $1
             ORDER BY ae.expires_at ASC`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting active effects:', error);
        return [];
    }
}

// Get usable items from inventory
async function getUsableItems(userId) {
    try {
        const result = await pool.query(
            `SELECT i.item_id, i.quantity, s.name, s.description, s.emoji_id, 
                    s.effect_type, s.effect_value, s.effect_duration
             FROM inventory i
             JOIN shop s ON i.item_id = s.item_id
             WHERE i.user_id = $1 AND s.type = 'usable'
             ORDER BY s.name`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting usable items:', error);
        return [];
    }
}

// Use an item
async function useItem(userId, itemId) {
    try {
        // Get item details from shop
        const itemResult = await pool.query(
            `SELECT * FROM shop WHERE item_id = $1 AND type = 'usable'`,
            [itemId]
        );

        if (itemResult.rows.length === 0) {
            return { success: false, message: "This item cannot be used!" };
        }

        const item = itemResult.rows[0];

        // Check if user has the item
        const inventoryResult = await pool.query(
            `SELECT quantity FROM inventory 
             WHERE user_id = $1 AND item_id = $2`,
            [userId, itemId]
        );

        if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity <= 0) {
            return { success: false, message: "You don't have this item!" };
        }

        // Add active effect
        const expiresAt = new Date(Date.now() + (item.effect_duration * 1000));
        await pool.query(
            `INSERT INTO active_effects (
                user_id, item_id, effect_type, effect_value, expires_at
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, item_id) 
            DO UPDATE SET 
                effect_value = EXCLUDED.effect_value,
                expires_at = EXCLUDED.expires_at,
                created_at = CURRENT_TIMESTAMP`,
            [userId, itemId, item.effect_type, item.effect_value, expiresAt]
        );

        // Remove one item from inventory
        await removeItemFromInventory(userId, itemId, 1);

        return { 
            success: true, 
            message: `Used ${item.name}! Effect: +${Math.round((item.effect_value - 1) * 100)}% XP for ${item.effect_duration / 60} minutes.`,
            effect: {
                type: item.effect_type,
                value: item.effect_value,
                duration: item.effect_duration
            },
            item: {
                name: item.name,
                id: item.item_id,
                emoji_id: item.emoji_id
            }
        };
    } catch (error) {
        console.error('Error using item:', error);
        return { success: false, message: "Something went wrong while using the item!" };
    }
}

module.exports = {
    pool,
    testConnection,
    recreateShopTable,
    initializeShopItems,
    initializeDatabase,
    addMissingColumns,
    getUserData,
    updateUserData,
    calculateNextLevelXp,
    addXp,
    trackMessage,
    trackCommand,
    generateProgressBar,
    getUserInventory,
    addItemToInventory,
    removeItemFromInventory,
    getShopItems,
    updateShopItems,
    getUserJob,
    setUserJob,
    updateLastWorked,
    getJobRequirements,
    getAllJobs,
    recreateJobRequirementsTable,
    recreateJobsTable,
    formatNumber,
    recreateAllTables,
    getLastQuitTime,
    setLastQuitTime,
    incrementDailyShifts,
    resetDailyShifts,
    createActiveEffectsTable,
    addActiveEffect,
    getActiveEffects,
    getUsableItems,
    useItem
}; 