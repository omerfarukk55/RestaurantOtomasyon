// config/config.js
module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE
    },
    db: {
        host: process.env.DB_SERVER,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    upload: {
        path: './uploads',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png']
    },
    backup: {
        path: './backups',
        schedule: '0 0 * * *' // Her gün gece yarısı
    }
};