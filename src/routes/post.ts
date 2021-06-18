import express from "express"
const router = express.Router()
const userService = require('../services/userService')
const postService = require('../services/postService')

/** New Post via POST */
router.post("/post/new", userService.authenticateMiddleware, postService.createPostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

/** Get Post */
router.all("/post/:id", userService.getAuthenticatedUserMiddleware, postService.getPostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

/** New Post via POST */
router.post("/post/:id/delete", userService.authenticateMiddleware, postService.deletePostMiddleware, (req, res) => res.status(200).send('OK'))

/** Like Post via POST */
router.post("/post/:id/like", userService.authenticateMiddleware, postService.getPostMiddleware, postService.likePostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

/** Unlike Post via POST */
router.post("/post/:id/unlike", userService.authenticateMiddleware, postService.getPostMiddleware, postService.unlikePostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

module.exports = router