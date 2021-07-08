import express from "express"
const router = express.Router()
const userService = require("../services/userService")
const paginationResultService = require("../services/paginationResultService")
const postService = require("../services/postService")

import path from "path"
import multer from "multer"

const multerStorage = multer.diskStorage({
	destination: (_, __, callback) => {
		callback(null, "./upload")
	},
	filename: (_, file, callback) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
		callback(null, uniqueSuffix + path.extname(file.originalname))
	},
})

const upload = multer({
	storage: multerStorage,
	fileFilter: (_, file, callback) => {
		if (file.mimetype.indexOf("image/") === -1)
			return callback("invalid mime type")

		callback(null, true)
	},
})

/** Registration via POST */
router.post(
    "/user/registration",
    userService.registerUserMiddleware,
    async (req, res) => res.json(await userService.exportUser(req.user, true))
)

/** Login via POST */
router.post("/user/login", userService.loginUserMiddleware, async (req, res) =>
    res.json(await userService.exportUser(req.user, true))
)

/** Login via POST */
router.all(
    "/validate-session",
    userService.authenticateMiddleware,
    async (req, res) => res.json(await userService.exportUser(req.user, true))
)

/** Update User via POST */
router.post(
    "/user/update",
    userService.authenticateMiddleware,
	(req, res, next) => {
		upload.single("profilePicture")(req, res, (error) => {
			if (error) return res.status(500).json({ error: error })

			next()
		})
	},
    userService.updateUserMiddleware,
    async (req, res) =>
        res.json(await userService.exportUser(req.data, true, req.user))
)

/** Get User */
router.all(
    "/user/:id",
    userService.getAuthenticatedUserMiddleware,
    userService.getUserMiddleware,
    async (req, res) =>
        res.json(await userService.exportUser(req.data, false, req.user))
)

/** Follow User via POST */
router.post(
    "/user/:id/follow",
    userService.authenticateMiddleware,
    userService.getUserMiddleware,
    userService.followUserMiddleware,
    async (req, res) =>
        res.json(await userService.exportUser(req.data, false, req.user))
)

/** Unfollow User via POST */
router.post(
    "/user/:id/unfollow",
    userService.authenticateMiddleware,
    userService.getUserMiddleware,
    userService.unfollowUserMiddleware,
    async (req, res) =>
        res.json(await userService.exportUser(req.data, false, req.user))
)

router.all(
    "/user/:id/posts",
    userService.getAuthenticatedUserMiddleware,
    userService.getUserMiddleware,
    paginationResultService.parsePaginationResultMiddleware(20),
    postService.getPostsFromUserMiddleware,
    async (req, res) => res.json(req.paginationResult)
)

router.all(
    "/home-timeline",
    userService.authenticateMiddleware,
    paginationResultService.parsePaginationResultMiddleware(20),
    postService.getHomeTimelineMiddleware,
    async (req, res) => res.json(req.paginationResult)
)

module.exports = router
