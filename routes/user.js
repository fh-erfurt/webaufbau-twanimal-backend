const express = require("express")
const router = express.Router()
const userService = require('../services/userService')

/** Registration via POST */
router.post("/user/registration", userService.registerUserMiddleware, (req, res) => res.json(req.user))

/** Login via POST */
router.post("/user/login", userService.loginUserMiddleware, (req, res) => res.json(req.user))

module.exports = router
