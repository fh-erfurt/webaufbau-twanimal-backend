import express from 'express'
const router = express.Router()

/** 
 * Index route for all request types to
 * show that the API is working
 */
router.all('/', (req, res) => {
	res.json({
		result: 'I am working',
	})
})

module.exports = router
