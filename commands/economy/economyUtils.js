const { Pool } = require('pg');

// Create a new pool using Railway's DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

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

        // Create index for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS economy_user_id_idx ON economy(user_id)
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
             SET balance = $1, level = $2, xp = $3, next_level_xp = $4
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

// Add XP to user
async function addXp(userId, amount) {
    const userData = await getUserData(userId);
    userData.xp += amount;

    // Check for level up
    while (userData.xp >= userData.nextLevelXp) {
        userData.level += 1;
        userData.xp -= userData.nextLevelXp;
        userData.nextLevelXp = calculateNextLevelXp(userData.level);
    }

    await updateUserData(userId, userData);
    return userData;
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

module.exports = {
    getUserData,
    updateUserData,
    addXp,
    generateProgressBar,
    defaultUserData
}; 