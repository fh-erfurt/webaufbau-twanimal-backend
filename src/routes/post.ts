import express from "express"
const router = express.Router()
const userService = require('../services/userService')
const postService = require('../services/postService')

import path from "path"
import multer from "multer"

const multerStorage = multer.diskStorage({
    destination: (_, __, callback) => {
        callback(null, './upload')
    },
    filename: (_, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        callback(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({ 
    storage: multerStorage,
    fileFilter: (_, file, callback) => {
        if(file.mimetype.indexOf('image/') === -1)
            return callback("invalid mime type")

        callback(null, true)
    }
})

/** New Post via POST */
router.post("/post/new", userService.authenticateMiddleware, (req, res, next) => {
    upload.array('attachements', 4)(req, res, (error) => {
        if(error)
            return res.json({ error: error })
        
        next()
    })
}, postService.createPostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

/** Get Post */
router.all("/post/:id", userService.getAuthenticatedUserMiddleware, postService.getPostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

/** New Post via POST */
router.post("/post/:id/delete", userService.authenticateMiddleware, postService.deletePostMiddleware, (req, res) => res.status(200).send('OK'))

/** Like Post via POST */
router.post("/post/:id/like", userService.authenticateMiddleware, postService.getPostMiddleware, postService.likePostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

/** Unlike Post via POST */
router.post("/post/:id/unlike", userService.authenticateMiddleware, postService.getPostMiddleware, postService.unlikePostMiddleware, async (req, res) => res.json(await postService.exportPost(req.data, req.user)))

module.exports = router