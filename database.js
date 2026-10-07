const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const waitForDatabase = async (retries = 15, delay = 3000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await query('SELECT 1');
            console.log('Database connection established');
            return;
        } catch (error) {
            console.log(`Database not ready, attempt ${attempt}/${retries}`);

            if (attempt === retries) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

const initializeDatabase = async () => {
    await waitForDatabase();

    await query(`
        CREATE TABLE IF NOT EXISTS ships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            tonnage INT NOT NULL,
            passengers INT NOT NULL,
            captain VARCHAR(255) NOT NULL,
            speed INT NOT NULL,
            mileage INT NOT NULL,
            price_per_ton DECIMAL(10,2) DEFAULT 0.00,
            price_per_person DECIMAL(10,2) DEFAULT 0.00,
            description TEXT,
            image VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tonnage (tonnage),
            INDEX idx_passengers (passengers),
            INDEX idx_speed (speed),
            INDEX idx_name (name)
        ) ENGINE=InnoDB
          DEFAULT CHARSET=utf8mb4
          COLLATE=utf8mb4_unicode_ci;
    `);

    const rows = await query('SELECT COUNT(*) AS count FROM ships');

    if (rows[0].count === 0) {
        await query(`
            INSERT INTO ships
            (name, tonnage, passengers, captain, speed, mileage,
             price_per_ton, price_per_person, description, image)
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'Морський Гігант', 1200, 300, 'Іван Петренко', 28, 15000, 50, 100,
            'Сучасний круїзний лайнер з усіма зручностями.', '/images/ship1.jpg',

            'Швидкий Вітер', 800, 150, 'Олена Коваль', 35, 20000, 60, 120,
            'Швидкісний корабель для морських подорожей.', '/images/ship2.jpg',

            'Океанська Зірка', 1600, 450, 'Михайло Сидоренко', 25, 18000, 45, 90,
            'Розкішний лайнер для довгих океанських круїзів.', '/images/ship3.jpg',

            'Атлантика', 1400, 320, 'Андрій Мельник', 22, 22000, 55, 110,
            'Комфортабельний корабель для сімейних подорожей.', '/images/ship4.jpg',

            'Блакитна Хвиля', 900, 180, 'Наталія Шевченко', 32, 17000, 65, 130,
            'Елегантне судно для романтичних круїзів.', '/images/ship5.jpg',

            'Золотий Вік', 2000, 600, 'Сергій Бондаренко', 20, 25000, 40, 80,
            'Величний лайнер з розкішними каютами.', '/images/ship6.jpg',

            'Морський Мандрівник', 750, 120, 'Віктор Ковальчук', 38, 12000, 70, 140,
            'Ідеальний для експедицій та досліджень.', '/images/ship7.jpeg'
        ]);
    }

    console.log('Database initialized successfully');
};

module.exports = {
    db,
    initializeDatabase
};
