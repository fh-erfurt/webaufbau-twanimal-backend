/** Import core libraries for REST-Server */
import express from 'express';
import http from 'http';
import https from 'https';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

import config from './config';
import { initialize } from './services/databaseService';

/** Intializing express */
const app = express()

let server = null

/** Initializing server with or without ssl */
if (config.ssl.enabled)
    server = https.createServer(
        {
            cert: fs.readFileSync(config.ssl.certificate),
            key: fs.readFileSync(config.ssl.key),
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
glob.sync("./dist/routes/**/*.js").forEach((file) => {
    console.log(file);
    const route = require(path.resolve(file))
    app.use(route)
})

/** Intialize database and starting server */
initialize()
    .then(() => {
        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`)
        })
    })
    .catch((error) => console.log("Failed connecting to database", error))
