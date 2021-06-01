const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function initialize() {
    await prisma.$connect()
}

module.exports = {
    initialize,
    prisma,
}
