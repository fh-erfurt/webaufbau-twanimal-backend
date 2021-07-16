import express from 'express'
const router = express.Router()
const userService = require('../services/userService')
const postService = require('../services/postService')
const searchService = require('../services/searchService')
const paginationResultService = require('../services/paginationResultService')

/**
 * Returns all posts matching query parameter with optional authentication
 *
 * @returns PaginationResult<PostExport>
 */
router.all(
	'/search/post/:query',
	userService.getAuthenticatedUserMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	searchService.searchPostsMiddleware,
	async (req, res) => res.json(req.paginationResult)
)

/**
 * Returns all users matching query parameter with optional authentication
 *
 * @returns PaginationResult<UserExport>
 */
router.all(
	'/search/user/:query',
	userService.getAuthenticatedUserMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	searchService.searchUsersMiddleware,
	async (req, res) => res.json(req.paginationResult)
)

/**
 * Returns all posts and users matching query parameter with optional authentication
 *
 * @returns PaginationResult<PostExport> & PaginationResult<UserExport>
 */
router.all(
	'/search/combined/:query',
	userService.getAuthenticatedUserMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	searchService.getCombinedMiddleware,
	async (req, res) =>
		res.json({
			users: req.users,
			posts: req.posts,
		})
)

module.exports = router
