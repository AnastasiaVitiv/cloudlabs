const express = require('express');
const path = require('path');
const cors = require('cors');
const { db, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.static(path.join(__dirname, 'build')));

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
        message: 'API works correctly!',
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

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({
                error: 'Database error'
            });
        }

        res.status(201).json({
            message: 'Ship created successfully',
            id: result.insertId
        });
    });
});

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available on port ${PORT}/api`);
        });
    })
    .catch((err) => {
        console.error('Database initialization failed:', err);
        process.exit(1);
    });
