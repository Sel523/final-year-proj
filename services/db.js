const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

async function query(sql, args) {
  // eslint-disable-next-line no-unused-vars
  const [rows, fields] = await pool.query(sql, args);

  return rows;
}

module.exports = {
  query,
};
