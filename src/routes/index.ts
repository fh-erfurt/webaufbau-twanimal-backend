import express from "express"
const router = express.Router()

/** Index Route for POST, GET, OPTION, ... for testing purpose */
router.all("/", (req, res) => {
    res.json({
        result: "I am working",
    })
})

module.exports = router
