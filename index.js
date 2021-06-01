/** Import core libraries for REST-Server */
const express = require("express")
const http = require("http")
const https = require("https")
const cookieParser = require("cookie-parser")
const fs = require("fs")
const path = require("path")
const { glob } = require("glob")

/** Import config and database */
const config = require("./config")
const databaseService = require("./services/databaseService")

/** Intializing express */
const app = express()

let server = null

/** Initializing server with or without ssl */
if (config.ssl.enabled)
    server = https.createServer(
        {
            cert: fs.readFileSync(config.ssl.certificate),
            key: fs.readFileSync(config.ssl.kesy),
        },
        app
    )
else server = http.createServer(app)

/** Intializing extensions for express */
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/** Making public-directory static */
app.use(express.static(`${__dirname}/public`))

/** Importing all routes from /routes */
glob.sync("./routes/**/*.js").forEach((file) => {
    const route = require(path.resolve(file))
    app.use(route)
})

/** Intialize database and starting server */
databaseService
    .initialize()
    .then(() => {
        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`)
        })
    })
    .catch((error) => console.log("Failed connecting to database", error))
