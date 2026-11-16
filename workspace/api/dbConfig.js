// Settings for sql.connect(). Still a plain object, not a function.
// The values now come from a .env file (see .env.example), so the password
// is never written in the code or pushed to GitHub.
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    trustServerCertificate: true, // local development
  },
};

module.exports = dbConfig;
