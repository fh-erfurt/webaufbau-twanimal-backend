const { prisma } = require("./databaseService")
const { isStringValid, isEmailValid } = require("./utilityService")
const bcrypt = require("bcrypt")
const config = require("../config")

function exportUser(user) {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePictureUrl: user.profilePictureUrl,
        description: user.description,
        createdAt: user.createdAt.getTime() / 1000,
    }
}

/** Creating database entry if email and username are not in use (case insensitive) */
async function registerUser(email, username, displayName, password) {
    const existingEmail = await prisma.user.findFirst({
        where: {
            email: email,
        },
    })

    if (existingEmail != null) throw "email in use"

    const existingUsername = await prisma.user.findFirst({
        where: {
            username: username,
        },
    })

    if (existingUsername != null) throw "username in use"

    const passwordHash = await bcrypt.hash(password, config.passwordSaltRounds)

    const user = await prisma.user.create({
        data: {
            email: email,
            username: username,
            displayName: displayName,
            password: passwordHash,
        },
    })

    return user
}

/** Express middlerware for registering user */
async function registerUserMiddleware(req, res, next) {
    const requiredKeys = ["email", "username", "displayName", "password"]
    const keysAvailable = requiredKeys.every((key) => req.body[key])

    if (!keysAvailable)
        return res.status(500).json({
            error: "missing keys",
        })

    const email = req.body.email
    const username = req.body.username
    const displayName = req.body.displayName
    const password = req.body.password

    if (!isEmailValid(email))
        return res.status(500).json({
            error: "invalid email",
        })

    if (!isStringValid(username, 2, 40))
        return res.status(500).json({
            error: "invalid username",
        })

    if (!isStringValid(displayName, 1, 120))
        return res.status(500).json({
            error: "invalid displayName",
        })

    if (!isStringValid(password, 8, 200))
        return res.status(500).json({
            error: "invalid displayName",
        })

    try {
        const user = await registerUser(email, username, displayName, password)

        req.user = exportUser(user)
        next()
    } catch (exception) {
        return res.status(500).json({
            error: exception,
        })
    }
}

/** Retrieving user and validating password if user exists */
async function loginUser(emailOrUsername, password) {
    const user = await prisma.user.findFirst({
        where: {
            OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
        },
    })

    if (user == null) throw "unknown user"

    const passwordValid = await bcrypt.compare(password, user.password)

    if (!passwordValid) throw "invalid password"

    return user
}

/** express middleware for logging in user */
async function loginUserMiddleware(req, res, next) {
    const requiredKeys = ["username", "password"]
    const keysAvailable = requiredKeys.every((key) => req.body[key])

    if (!keysAvailable)
        return res.status(500).json({
            error: "missing keys",
        })

    const username = req.body.username
    const password = req.body.password

    try {
        const user = await loginUser(username, password)

        req.user = exportUser(user)
        next()
    } catch (exception) {
        return res.status(500).json({
            error: exception,
        })
    }
}

module.exports = {
    exportUser,
    registerUser,
    registerUserMiddleware,
    loginUser,
    loginUserMiddleware,
}
