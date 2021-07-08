import dotenv from "dotenv"
dotenv.config()

export default {
    port: process.env.PORT,
    assetPrefix: process.env.ASSET_PREFIX,
    ssl: {
        enabled: process.env.SSL_ENABLED === "true",
        certificate: process.env.SSL_CERTIFICATE,
        key: process.env.SSL_KEY,
    },
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS),
}
