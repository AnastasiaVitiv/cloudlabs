const db = require('./database');

exports.getAllShips = (req, res) => {
    let sql = 'SELECT * FROM ships WHERE 1=1';
    const params = [];

    if (req.query.tonnage) {
        const tonnageRange = req.query.tonnage;
        if (tonnageRange === '0-1000') {
            sql += ' AND tonnage BETWEEN ? AND ?';
            params.push(0, 1000);
        } else if (tonnageRange === '1000-1500') {
            sql += ' AND tonnage BETWEEN ? AND ?';
            params.push(1000, 1500);
        } else if (tonnageRange === '1500+') {
            sql += ' AND tonnage > ?';
            params.push(1500);
        }
    }

    if (req.query.passengers) {
        const passengersRange = req.query.passengers;
        if (passengersRange === '0-250') {
            sql += ' AND passengers BETWEEN ? AND ?';
            params.push(0, 250);
        } else if (passengersRange === '250-400') {
            sql += ' AND passengers BETWEEN ? AND ?';
            params.push(250, 400);
        } else if (passengersRange === '400+') {
            sql += ' AND passengers > ?';
            params.push(400);
        }
    }

    if (req.query.speed) {
        const speedRange = req.query.speed;
        if (speedRange === '0-25') {
            sql += ' AND speed BETWEEN ? AND ?';
            params.push(0, 25);
        } else if (speedRange === '25-30') {
            sql += ' AND speed BETWEEN ? AND ?';
            params.push(25, 30);
        } else if (speedRange === '30+') {
            sql += ' AND speed > ?';
            params.push(30);
        }
    }

    if (req.query.search) {
        sql += ' AND name LIKE ?';
        params.push(`%${req.query.search}%`);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Помилка запиту до бази даних:', err);
            return res.status(500).json({ error: 'Помилка сервера' });
        }
        res.json(results);
    });
};

exports.getShipById = (req, res) => {
    const shipId = req.params.id;

    const sql = 'SELECT * FROM ships WHERE id = ?';

    db.query(sql, [shipId], (err, results) => {
        if (err) {
            console.error('Помилка запиту до бази даних:', err);
            return res.status(500).json({ error: 'Помилка сервера' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Корабель не знайдено' });
        }

        res.json(results[0]);
    });
};

exports.searchShips = (req, res) => {
    const searchTerm = req.query.q;

    const sql = 'SELECT * FROM ships WHERE name LIKE ? OR description LIKE ?';
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Помилка пошуку:', err);
            return res.status(500).json({ error: 'Помилка пошуку' });
        }
        res.json(results);
    });
};
