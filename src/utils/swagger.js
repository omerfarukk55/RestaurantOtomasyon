// src/utils/swagger.js
const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Restaurant API',
            version: '1.0.0', 
            description: 'Restaurant Management System API'
        },
        servers: [
            {
                url: 'http://localhost:5000/api'
            }
        ]
    },
    apis: ['./src/routes/*.js']
};

const specs = swaggerJsDoc(options);
module.exports = specs;