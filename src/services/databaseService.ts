import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function initialize() {
    await prisma.$connect()
}

export {
    initialize,
    prisma,
}
