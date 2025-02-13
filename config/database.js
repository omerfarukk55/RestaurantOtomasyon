const sql = require('mssql');
require('dotenv').config();

const config = {
    server: 'localhost',
    database: 'restaurant_db',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        trustedConnection: true, // Windows Authentication
        integratedSecurity: true // Windows Authentication
    }
};

async function connectDB() {
    try {
        await sql.connect(config);
        console.log('Connected to SQL Server');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

module.exports = {
    connectDB,
    sql
};