import express from "express"
const router = express.Router()
const userService = require("../services/userService")
const postService = require("../services/postService")
const searchService = require("../services/searchService")
const paginationResultService = require("../services/paginationResultService")

/** Search for posts */
router.all(
	"/search/post/:query",
	userService.getAuthenticatedUserMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	searchService.searchPostsMiddleware,
    async (req, res) => res.json(req.paginationResult)
)

/** Search for users */
router.all(
	"/search/user/:query",
	userService.getAuthenticatedUserMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	searchService.searchUsersMiddleware,
    async (req, res) => res.json(req.paginationResult)
)

/** Search for users and posts combined */
router.all(
	"/search/combined/:query",
	userService.getAuthenticatedUserMiddleware,
	paginationResultService.parsePaginationResultMiddleware(20),
	searchService.getCombinedMiddleware,
    async (req, res) => res.json({
		users: req.users,
		posts: req.posts
	})
)

module.exports = router
