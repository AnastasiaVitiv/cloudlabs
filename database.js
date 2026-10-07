const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    charset: 'utf8mb4'
});

connection.connect((err) => {
    if (err) {
        console.error('Помилка підключення до MySQL:', err);
        return;
    }
    console.log('Підключено до MySQL бази даних');
});

module.exports = connection;
