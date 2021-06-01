const dotenv = require("dotenv")
dotenv.config()

module.exports = {
    port: process.env.PORT,
    ssl: {
        enabled: process.env.SSL_ENABLED === "true",
        certificate: process.env.SSL_CERTIFICATE,
        key: process.env.SSL_KEY,
    },
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS),
}
