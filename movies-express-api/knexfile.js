require('dotenv').config()

module.exports = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        database: 'movies',
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    }
}