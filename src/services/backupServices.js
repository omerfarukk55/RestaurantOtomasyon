// src/services/backupService.js
const { sql } = require('../../config/database');
const path = require('path');
const fs = require('fs');

class BackupService {
    static async createBackup() {
        const date = new Date().toISOString().split('T')[0];
        const backupPath = path.join(__dirname, '../../backups', `backup-${date}.sql`);

        try {
            const tables = ['users', 'products', 'categories', 'orders', 'credit_book'];
            let backupData = '';

            for (const table of tables) {
                const result = await sql.query`SELECT * FROM ${table}`;
                backupData += `-- Table: ${table}\n`;
                backupData += JSON.stringify(result.recordset, null, 2);
                backupData += '\n\n';
            }

            fs.writeFileSync(backupPath, backupData);
            return backupPath;
        } catch (error) {
            throw new Error(`Backup failed: ${error.message}`);
        }
    }
}

module.exports = BackupService;