import express from "express"
const router = express.Router()
const userService = require("../services/userService")
const postService = require("../services/postService")
const paginationResultService = require("../services/paginationResultService")

import path from "path"
import multer from "multer"

/**
 * Determine the destination and file name for uploaded
 * files which stores uploaded files in req.file or
 * req.files based on parameters (array, single)
 */
const multerStorage = multer.diskStorage({
	destination: (_, __, callback) => {
		callback(null, "./upload")
	},
	filename: (_, file, callback) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
		callback(null, uniqueSuffix + path.extname(file.originalname))
	},
})

/**
 * Initialize multer with filtering files which aren't
 * image-files (gifs allowed)
 */
const upload = multer({
	storage: multerStorage,
	fileFilter: (_, file, callback) => {
		if (file.mimetype.indexOf("image/") === -1)
			return callback("invalid mime type")

		callback(null, true)
	},
})

/** 
 * Create new post with required authentication
 * and up to 4 attachements
 * 
 * @returns PostExport
 */
router.post(
	"/post/new",
	userService.authenticateMiddleware,
	(req, res, next) => {
		upload.array("attachements", 4)(req, res, (error) => {
			if (error) return res.status(500).json({ error: error })

			next()
		})
	},
	postService.createPostMiddleware,
	async (req, res) =>
		res.json(await postService.exportPost(req.data, req.user))
)

/** 
 * Get post by id with optional authentication
 * 
 * @returns PostExport
 */
router.all(
	"/post/:id",
	userService.getAuthenticatedUserMiddleware,
	postService.getPostMiddleware,
	async (req, res) =>
		res.json(await postService.exportPost(req.data, req.user))
)

/**
 * Delete post with id with required authentication
 * for creator of the post
 * 
 * @returns String ('OK')
 */
router.post(
	"/post/:id/delete",
	userService.authenticateMiddleware,
	postService.deletePostMiddleware,
	(req, res) => res.status(200).send("OK")
)

/**
 * Like post with id with required authentication
 * 
 * @returns PostExport
 */
router.post(
	"/post/:id/like",
	userService.authenticateMiddleware,
	postService.getPostMiddleware,
	postService.likePostMiddleware,
	async (req, res) =>
		res.json(await postService.exportPost(req.data, req.user))
)

/**
 * Unlike post with id with required authentication
 * 
 * @returns PostExport
 */
router.post(
	"/post/:id/unlike",
	userService.authenticateMiddleware,
	postService.getPostMiddleware,
	postService.unlikePostMiddleware,
	async (req, res) =>
		res.json(await postService.exportPost(req.data, req.user))
)

/**
 * Get all replies from post with id with optional authentication
 * 
 * @returns PaginationResult<PostExport>
 * 
 */
router.all(
	"/post/:id/replies",
	userService.getAuthenticatedUserMiddleware,
    paginationResultService.parsePaginationResultMiddleware(20),
    postService.getRepliesMiddleware,
    (req, res) => res.json(req.paginationResult)
)

module.exports = router
