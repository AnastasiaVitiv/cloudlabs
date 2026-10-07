const express = require('express');
const router = express.Router();
const shipsController = require('./shipsController');

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM ships';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

router.get('/:id', (req, res) => {
    const sql = 'SELECT * FROM ships WHERE id = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Ship not found' });
        }
        res.json(results[0]);
    });
});

module.exports = router;
