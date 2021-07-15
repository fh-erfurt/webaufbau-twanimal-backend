import express from 'express'
const router = express.Router()
const userService = require('../services/userService')
const paginationResultService = require('../services/paginationResultService')
const postService = require('../services/postService')

import path from 'path'
import multer from 'multer'

/**
 * Determine the destination and file name for uploaded
 * files which stores uploaded files in req.file or
 * req.files based on parameters (array, single)
 */
const multerStorage = multer.diskStorage({
	destination: (_, __, callback) => {
		callback(null, './upload')
	},
	filename: (_, file, callback) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		callback(null, uniqueSuffix + path.extname(file.originalname))
	},
})

/**
 * Initialize multer with filtering files which aren't
 * image-files
 */
const upload = multer({
	storage: multerStorage,
	fileFilter: (_, file, callback) => {
		if (file.mimetype.indexOf('image/') === -1) return callback('invalid mime type')

		callback(null, true)
	},
})

/**
 * Creates user based on post body parameters
 *
 * @returns UserExport with APIToken
 */
router.post('/user/registration', userService.registerUserMiddleware, async (req, res) =>
	res.json(await userService.exportUser(req.user, true))
)

/**
 * Returns user based on post body parameters
 *
 * @returns UserExport with APIToken
 */
router.post('/user/login', userService.loginUserMiddleware, async (req, res) =>
	res.json(await userService.exportUser(req.user, true))
)

/**
 * Validates Session based on authorization header
 *
 * @returns UserExport with APIToken
 */
router.all('/validate-session', userService.authenticateMiddleware, async (req, res) =>
	res.json(await userService.exportUser(req.user, true))
)

/**
 * Updates user based on post body parameters
 * with required authentication
 * 
 * @returns UserExport with APIToken
 */
router.post(
	'/user/update',
	userService.authenticateMiddleware,
	(req, res, next) => {
		upload.single('profilePicture')(req, res, (error) => {
			if (error) return res.status(500).json({ error: error })

			next()
		})
	},
	userService.updateUserMiddleware,
	async (req, res) => res.json(await userService.exportUser(req.data, true, req.user))
)

/**
 * Get user by id with optional authentication
 * 
 * @returns UserExport
 */
router.all('/user/:id', userService.getAuthenticatedUserMiddleware, userService.getUserMiddleware, async (req, res) =>
	res.json(await userService.exportUser(req.data, false, req.user))
)

/** 
 * Follows user with id with required authentication
 * 
 * @returns UserExport
 */
router.post(
	'/user/:id/follow',
	userService.authenticateMiddleware,
	userService.getUserMiddleware,
	userService.followUserMiddleware,
	async (req, res) => res.json(await userService.exportUser(req.data, false, req.user))
)

/** 
 * Unfollows user with id with required authentication
 * 
 * @returns UserExport
 */
router.post(
	'/user/:id/unfollow',
	userService.authenticateMiddleware,
	userService.getUserMiddleware,
	userService.unfollowUserMiddleware,
	async (req, res) => res.json(await userService.exportUser(req.data, false, req.user))
)

/**
 * Get all posts from user with id with optional authentication
 * 
 * @returns PaginationResult<PostExport>
 * 
 */
router.all(
	'/user/:id/posts',
	userService.getAuthenticatedUserMiddleware,
	userService.getUserMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	postService.getPostsFromUserMiddleware,
	(req, res) => res.json(req.paginationResult)
)

/**
 * Get all posts from users which the authenticated 
 * user (required) follows
 * 
 * @returns PaginationResult<PostExport>
 * 
 */
router.all(
	'/home-timeline',
	userService.authenticateMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	postService.getHomeTimelineMiddleware,
	(req, res) => res.json(req.paginationResult)
)

/**
 * Get follow suggestions from authenticated 
 * user (required) which user does not follow yet
 * 
 * @returns PaginationResult<UserExport>
 * 
 */
router.all(
	'/suggestions',
	userService.authenticateMiddleware,
	paginationResultService.parsePaginationResultMiddleware(5, 20),
	userService.getUserSuggestionsMiddleware,
	(req, res) => res.json(req.paginationResult)
)

module.exports = router
