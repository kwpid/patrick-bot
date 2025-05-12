const { Pool } = require('pg');
const { EmbedBuilder } = require('discord.js');
const { chests } = require('./chests.json');

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
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE
            )
        `);

        // Create shop table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shop (
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
            const chests = require('./chests.json').chests;
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
        const shopItems = require('./shopItems.json').items;
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
                    item.on_sale,
                    0
                ]
            );
        }

        // Create jobs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                user_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                job_name TEXT NOT NULL,
                last_worked TIMESTAMP,
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
                salary INTEGER NOT NULL
            )
        `);

        // Initialize job requirements if empty
        const jobCheck = await pool.query('SELECT COUNT(*) FROM job_requirements');
        if (jobCheck.rows[0].count === '0') {
            const jobs = [
                ['lemonade_booth', 'Lemonade Booth', 0, 200],
                ['chum_janitor', 'Chum Bucket Janitor', 3, 350],
                ['shake_server', 'Kelp Shake Server', 5, 500],
                ['boating_assistant', 'Boating School Assistant', 8, 650],
                ['jelly_harvester', 'Jellyfish Jelly Harvester', 11, 800],
                ['goo_lifeguard', 'Lifeguard at Goo Lagoon', 14, 1000],
                ['lab_assistant', 'Sandy\'s Lab Assistant', 17, 1200],
                ['tour_guide', 'Atlantis Tour Guide', 21, 1500],
                ['krab_manager', 'Krusty Krab Manager', 25, 1800],
                ['krab_owner', 'Krusty Krab Owner', 30, 2500]
            ];

            for (const [id, name, level, salary] of jobs) {
                await pool.query(
                    'INSERT INTO job_requirements (job_id, job_name, required_level, salary) VALUES ($1, $2, $3, $4)',
                    [id, name, level, salary]
                );
            }
        }

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
async function addXp(userId, amount, message) {
    try {
        const userData = await getUserData(userId);
        if (!userData) return null;

        const oldLevel = userData.level;
        userData.xp += amount;

        // Check for level up
        while (userData.xp >= userData.nextLevelXp) {
            const overflowXp = userData.xp - userData.nextLevelXp;
            userData.level += 1;
            userData.nextLevelXp = calculateNextLevelXp(userData.level);
            userData.xp = overflowXp;
            
            // Add coins for level up - reward is 100 * level
            const levelReward = userData.level * 100;
            userData.balance += levelReward;

            // Give chest every level
            let chestId;
            if (userData.level <= 5) {
                chestId = 'chest_1'; // Basic chest for levels 1-5
            } else if (userData.level <= 10) {
                chestId = 'chest_2'; // Rare chest for levels 6-10
            } else {
                chestId = 'chest_3'; // Epic chest for levels 11+
            }

            // Add chest to inventory
            const chestAdded = await addItemToInventory(userId, chestId);
            if (!chestAdded) {
                console.error(`Failed to add chest ${chestId} to inventory for user ${userId}`);
            }
        }

        await updateUserData(userId, userData);

        // Send level up message if leveled up
        if (userData.level > oldLevel) {
            let description = `*${message.author.username} has reached level ${userData.level}!*\n` +
                            `*you earned ${formatNumber(userData.level * 100)} <:patrickcoin:1371211412940132492>!*`;

            // Add chest message
            let chestId;
            if (userData.level <= 5) {
                chestId = 'chest_1';
            } else if (userData.level <= 10) {
                chestId = 'chest_2';
            } else {
                chestId = 'chest_3';
            }

            // Get chest name from database
            const chestResult = await pool.query(
                'SELECT name FROM chests WHERE chest_id = $1',
                [chestId]
            );

            if (chestResult.rows.length > 0) {
                description += `\n*you received a ${chestResult.rows[0].name}!*`;
            }

            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle('Level Up!')
                .setDescription(description)
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            try {
                await message.channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Error sending level up message:', error);
            }
        }

        return userData;
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
        const shopItems = require('./shopItems.json').items.filter(item => item.type !== 'chest');
        
        // Select 3-5 random items for the shop
        const numItems = Math.floor(Math.random() * 3) + 3; // Random number between 3-5
        const selectedItems = shopItems
            .sort(() => Math.random() - 0.5)
            .slice(0, numItems);
        
        // Update all items to not be on sale first
        await pool.query('UPDATE shop SET on_sale = false');
        
        // Insert or update selected items
        for (const item of selectedItems) {
            await pool.query(
                `INSERT INTO shop (
                    item_id, name, description, price, emoji_id, 
                    tags, value, type, on_sale
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (item_id) 
                DO UPDATE SET 
                    on_sale = $9,
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
                salary INTEGER NOT NULL
            )
        `);
        console.log('Created new job_requirements table');

        // Initialize job requirements
        const jobs = [
            ['lemonade_booth', 'Lemonade Booth', 0, 200],
            ['chum_janitor', 'Chum Bucket Janitor', 3, 350],
            ['shake_server', 'Kelp Shake Server', 5, 500],
            ['boating_assistant', 'Boating School Assistant', 8, 650],
            ['jelly_harvester', 'Jellyfish Jelly Harvester', 11, 800],
            ['goo_lifeguard', 'Lifeguard at Goo Lagoon', 14, 1000],
            ['lab_assistant', 'Sandy\'s Lab Assistant', 17, 1200],
            ['tour_guide', 'Atlantis Tour Guide', 21, 1500],
            ['krab_manager', 'Krusty Krab Manager', 25, 1800],
            ['krab_owner', 'Krusty Krab Owner', 30, 2500]
        ];

        console.log('Inserting jobs into job_requirements table...');
        for (const [id, name, level, salary] of jobs) {
            await pool.query(
                'INSERT INTO job_requirements (job_id, job_name, required_level, salary) VALUES ($1, $2, $3, $4)',
                [id, name, level, salary]
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
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
                salary INTEGER NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE jobs (
                user_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                job_name TEXT NOT NULL,
                last_worked TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES economy(user_id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES job_requirements(job_id) ON DELETE CASCADE
            )
        `);

        // Initialize shop items
        await initializeShopItems();

        // Initialize job requirements
        const jobs = [
            ['lemonade_booth', 'Lemonade Booth', 0, 200],
            ['chum_janitor', 'Chum Bucket Janitor', 3, 350],
            ['shake_server', 'Kelp Shake Server', 5, 500],
            ['boating_assistant', 'Boating School Assistant', 8, 650],
            ['jelly_harvester', 'Jellyfish Jelly Harvester', 11, 800],
            ['goo_lifeguard', 'Lifeguard at Goo Lagoon', 14, 1000],
            ['lab_assistant', 'Sandy\'s Lab Assistant', 17, 1200],
            ['tour_guide', 'Atlantis Tour Guide', 21, 1500],
            ['krab_manager', 'Krusty Krab Manager', 25, 1800],
            ['krab_owner', 'Krusty Krab Owner', 30, 2500]
        ];

        for (const [id, name, level, salary] of jobs) {
            await pool.query(
                'INSERT INTO job_requirements (job_id, job_name, required_level, salary) VALUES ($1, $2, $3, $4)',
                [id, name, level, salary]
            );
        }

        console.log('All tables recreated successfully');
        return true;
    } catch (error) {
        console.error('Error recreating tables:', error);
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
    updateShopItems,
    getUserJob,
    setUserJob,
    updateLastWorked,
    getJobRequirements,
    getAllJobs,
    recreateJobRequirementsTable,
    recreateJobsTable,
    formatNumber,
    recreateAllTables
}; 
