const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'JoinSpots API',
            version: '1.0.0',
            description: 'Documentation API pour JoinSpots',
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production' 
                    ? 'https://api.joinspots.com' 
                    : 'http://localhost:7856',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token'
                }
            }
        }
    },
    apis: ['./routes/*.js', './controllers/*.js'], // chemins des fichiers à documenter
};

const specs = swaggerJsdoc(options);

module.exports = specs; 