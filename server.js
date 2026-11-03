const express = require('express');
const path = require('path');
const cors = require('cors');
const { db, initializeDatabase } = require('./database');
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 3005;

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 500, 5000)
    }
});

redisClient.on('error', (error) => {
    console.error('Redis Client Error:', error);
});

const CACHE_TTL_SECONDS = Number(
    process.env.CACHE_TTL_SECONDS || 45
);

const CACHE_VERSION_KEY = 'ships:cache:version';

async function invalidateShipCache() {
    await redisClient.incr(CACHE_VERSION_KEY);
}

async function shipReadCache(req, res, next) {
    if (req.method !== 'GET') {
        return next();
    }

    if (req.get('X-Cache-Mode') === 'bypass') {
        res.set('X-Cache', 'BYPASS');
        return next();
    }

    try {
        let version = await redisClient.get(CACHE_VERSION_KEY);

        if (version === null) {
            await redisClient.set(
                CACHE_VERSION_KEY,
                '1',
                { NX: true }
            );

            version = await redisClient.get(CACHE_VERSION_KEY) || '1';
        }

        const cacheKey = `ships:${version}:${req.originalUrl}`;

        const cached = await redisClient.get(cacheKey);

        if (cached) {
            const data = JSON.parse(cached);

            res.set('X-Cache', 'HIT');

            return res.status(data.statusCode).json(data.body);
        }

        res.set('X-Cache', 'MISS');

        const originalJson = res.json.bind(res);

        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                redisClient.setEx(
                    cacheKey,
                    CACHE_TTL_SECONDS,
                    JSON.stringify({
                        statusCode: res.statusCode,
                        body
                    })
                ).catch((error) => {
                    console.error('Redis cache write error:', error);
                });
            }

            return originalJson(body);
        };

        return next();

    } catch (error) {
        console.error('Redis cache error:', error);
        res.set('X-Cache', 'ERROR');
        return next();
    }
}
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Cache-Mode'
    ],
    exposedHeaders: ['X-Cache'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.static(path.join(__dirname, 'build')));

app.use('/api/ships', shipReadCache);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const logButtonClick = (buttonName, additionalData = {}) => {
    console.log('=== BUTTON CLICK LOG ===');
    console.log('Button:', buttonName);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Additional Data:', additionalData);
    console.log('=== END BUTTON LOG ===');
};

app.get('/api/test', (req, res) => {
    res.json({
        message: 'API works correctly! - deployment test',
        timestamp: new Date().toISOString(),
        status: 'success'
    });
});

app.get('/api/log/home-view-more', (req, res) => {
    logButtonClick('Home Page - View More', {
        currentShipsCount: req.query.currentCount,
        totalShipsCount: req.query.totalCount
    });
    res.json({
        status: 'logged',
        message: 'View More button click logged successfully'
    });
});

app.get('/api/log/navigation', (req, res) => {
    const page = req.query.page;
    logButtonClick(`Navigation - ${page}`);
    res.json({
        status: 'logged',
        message: `Navigation to ${page} logged successfully`
    });
});

app.get('/api/log/ship-details', (req, res) => {
    const shipId = req.query.shipId;
    const shipName = req.query.shipName;
    logButtonClick('Ship Card - Details', {
        shipId: shipId,
        shipName: shipName
    });
    res.json({
        status: 'logged',
        message: 'Ship details button click logged successfully'
    });
});

app.get('/api/log/add-to-cart', (req, res) => {
    const shipId = req.query.shipId;
    const shipName = req.query.shipName;
    logButtonClick('Ship Details - Add to Cart', {
        shipId: shipId,
        shipName: shipName
    });
    res.json({
        status: 'logged',
        message: 'Add to cart button click logged successfully'
    });
});

app.get('/api/log/back-to-catalog', (req, res) => {
    const fromPage = req.query.from;
    logButtonClick('Back to Catalog', {
        fromPage: fromPage
    });
    res.json({
        status: 'logged',
        message: 'Back to catalog button click logged successfully'
    });
});

app.get('/api/log/clear-filters', (req, res) => {
    logButtonClick('Catalog - Clear Filters');
    res.json({
        status: 'logged',
        message: 'Clear filters button click logged successfully'
    });
});

app.get('/api/log/catalog-view-more', (req, res) => {
    logButtonClick('Catalog - View More', {
        currentShipsCount: req.query.currentCount,
        totalShipsCount: req.query.totalCount
    });
    res.json({
        status: 'logged',
        message: 'Catalog View More button click logged successfully'
    });
});

app.get('/api/ships', (req, res) => {
    console.log('=== SERVER: GET /api/ships ===');
    console.log('SERVER: Query параметри:', req.query);

    let sql = 'SELECT * FROM ships WHERE 1=1';
    const params = [];

    if (req.query.tonnage && req.query.tonnage !== '') {
        console.log('SERVER: Застосовуємо фільтр тонажу:', req.query.tonnage);
        if (req.query.tonnage === '0-1000') {
            sql += ' AND tonnage <= ?';
            params.push(1000);
        } else if (req.query.tonnage === '1000-1500') {
            sql += ' AND tonnage > ? AND tonnage <= ?';
            params.push(1000, 1500);
        } else if (req.query.tonnage === '1500+') {
            sql += ' AND tonnage > ?';
            params.push(1500);
        }
    }

    if (req.query.passengers && req.query.passengers !== '') {
        console.log('SERVER: Застосовуємо фільтр пасажирів:', req.query.passengers);
        if (req.query.passengers === '0-250') {
            sql += ' AND passengers <= ?';
            params.push(250);
        } else if (req.query.passengers === '250-400') {
            sql += ' AND passengers > ? AND passengers <= ?';
            params.push(250, 400);
        } else if (req.query.passengers === '400+') {
            sql += ' AND passengers > ?';
            params.push(400);
        }
    }

    if (req.query.speed && req.query.speed !== '') {
        console.log('SERVER: Застосовуємо фільтр швидкості:', req.query.speed);
        if (req.query.speed === '0-25') {
            sql += ' AND speed <= ?';
            params.push(25);
        } else if (req.query.speed === '25-30') {
            sql += ' AND speed > ? AND speed <= ?';
            params.push(25, 30);
        } else if (req.query.speed === '30+') {
            sql += ' AND speed > ?';
            params.push(30);
        }
    }

    if (req.query.search && req.query.search !== '') {
        console.log('SERVER: Застосовуємо пошук:', req.query.search);
        sql += ' AND name LIKE ?';
        params.push(`%${req.query.search}%`);
    }

    sql += ' ORDER BY id';

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('SERVER: Фінальний SQL запит:', sql);
    console.log('SERVER: Параметри:', params);
    console.log('SERVER: Пагінація - сторінка:', page, 'ліміт:', limit, 'offset:', offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('SERVER: Помилка бази даних:', err);
            return res.status(500).json({
                error: 'Database error',
                details: err.message
            });
        }

        console.log(`SERVER: Повертаємо ${results.length} кораблів`);
        console.log('SERVER: Кораблі:', results.map(ship => ship.name));
        res.json(results);
    });
});

app.get('/api/ships/:id', (req, res) => {
    const shipId = req.params.id;
    console.log(`SERVER: GET /api/ships/${shipId} запит отримано`);

    const sql = 'SELECT * FROM ships WHERE id = ?';
    db.query(sql, [shipId], (err, results) => {
        if (err) {
            console.error('SERVER: Помилка бази даних:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Ship not found' });
        }

        res.json(results[0]);
    });
});

app.post('/api/ships', (req, res) => {
    const {
        name,
        tonnage,
        passengers,
        captain,
        speed,
        mileage,
        price_per_ton = 0,
        price_per_person = 0,
        description = '',
        image = ''
    } = req.body;

    if (
        !name ||
        tonnage === undefined ||
        passengers === undefined ||
        !captain ||
        speed === undefined ||
        mileage === undefined
    ) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }

    const sql = `
        INSERT INTO ships
        (
            name,
            tonnage,
            passengers,
            captain,
            speed,
            mileage,
            price_per_ton,
            price_per_person,
            description,
            image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        name,
        tonnage,
        passengers,
        captain,
        speed,
        mileage,
        price_per_ton,
        price_per_person,
        description,
        image
    ];

    db.query(sql, params, async (err, result) => {
        if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({
                error: 'Database error'
            });
        }
        try {
            await invalidateShipCache();
        } catch (cacheError) {
            console.error('Redis cache invalidation error:', cacheError);
        }

        return res.status(201).json({
            message: 'Ship created successfully',
            id: result.insertId
        });
    });
});

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

Promise.all([
    initializeDatabase(),
    redisClient.connect()
])
    .then(async () => {
        await redisClient.set(
            CACHE_VERSION_KEY,
            '1',
            { NX: true }
        );

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Redis connected successfully');
            console.log(`API available on port ${PORT}/api`);
        });
    })
    .catch((err) => {
        console.error('Application initialization failed:', err);
        process.exit(1);
    });
