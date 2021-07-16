import { prisma } from './databaseService'
import { isStringValid } from './utilityService'
import { Post, User } from '@prisma/client'
import { PaginationResult } from './paginationResultService'

import { exportUser } from './userService'
import { convertPostsToPostExport } from './postService'

/**
 * Returns post as pagination result maching query
 */
async function searchPosts(
	query: string,
	requester: User,
	paginationResult?: PaginationResult
): Promise<PaginationResult> {
	if (!paginationResult) paginationResult = { limit: 20, page: 0 }
	const posts = await prisma.post.findMany({
		take: paginationResult.limit + 1,
		skip: paginationResult.limit * paginationResult.page,
		where: {
			OR: [
				{ text: { contains: query } },
				{ user: { displayName: { contains: query } } },
				{ user: { username: { contains: query } } },
				{ user: { description: { contains: query } } },
			],
		},
		include: {
			replyToPost: {
				include: {
					user: true,
				},
			},
			repostOfPost: {
				include: {
					user: true,
				},
			},
			user: {
				include: {
					followTo: true,
				},
			},
		},
		orderBy: {
			id: 'desc',
		},
	})

	const postCount = await prisma.post.count({
		where: {
			OR: [
				{ text: { contains: query } },
				{ user: { displayName: { contains: query } } },
				{ user: { username: { contains: query } } },
				{ user: { description: { contains: query } } },
			],
		},
	})

	const output = await convertPostsToPostExport(posts, requester)

	paginationResult.total = postCount
	paginationResult.moreAvailable = output.length > paginationResult.limit
	paginationResult.results = output.slice(0, paginationResult.limit)

	return paginationResult
}

async function searchPostsMiddleware(req, res, next) {
	const paginationResult: PaginationResult = req.paginationResult
	const user: User = req.data

	req.data = await searchPosts(req.params.query, user, paginationResult)
	next()
}

/**
 * Returns users as pagination result based on query
 *
 * @param query
 * @param requester
 * @param paginationResult
 * @returns
 */
async function searchUsers(
	query: string,
	requester: User,
	paginationResult?: PaginationResult
): Promise<PaginationResult> {
	if (!paginationResult) paginationResult = { limit: 20, page: 0 }

	const users = await prisma.user.findMany({
		take: paginationResult.limit + 1,
		skip: paginationResult.limit * paginationResult.page,
		where: {
			OR: [
				{ displayName: { contains: query } },
				{ username: { contains: query } },
				{ description: { contains: query } },
			],
		},
		orderBy: {
			id: 'desc',
		},
	})

	const userCount = await prisma.user.count({
		where: {
			OR: [
				{ displayName: { contains: query } },
				{ username: { contains: query } },
				{ description: { contains: query } },
			],
		},
	})

	const output = []

	for (const user of users) output.push(await exportUser(user, false, requester))

	paginationResult.total = userCount
	paginationResult.moreAvailable = output.length > paginationResult.limit
	paginationResult.results = output.slice(0, paginationResult.limit)

	return paginationResult
}

async function searchUsersMiddleware(req, res, next) {
	const paginationResult: PaginationResult = req.paginationResult
	const user: User = req.data

	req.data = await searchUsers(req.params.query, user, paginationResult)
	next()
}

/**
 * Returns posts and users combined with each pagination result
 *
 * @param req
 * @param res
 * @param next
 */
async function getCombinedMiddleware(req, res, next) {
	const paginationResult: PaginationResult = req.paginationResult
	const user: User = req.data

	req.posts = await searchPosts(req.params.query, user, JSON.parse(JSON.stringify(paginationResult)))
	req.users = await searchUsers(req.params.query, user, paginationResult)
	next()
}

export { searchPostsMiddleware, searchUsersMiddleware, getCombinedMiddleware }
