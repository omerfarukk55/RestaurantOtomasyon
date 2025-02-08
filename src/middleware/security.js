// src/middleware/security.js
const helmet = require('helmet');
const xss = require('xss-clean');

const securityMiddleware = [
    helmet(),
    xss(),
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            scriptSrc: ["'self'"]
        }
    })
];

module.exports = securityMiddleware;