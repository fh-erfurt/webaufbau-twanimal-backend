import { prisma } from "./databaseService"
import { isStringValid } from "./utilityService"
import { Post, User } from '@prisma/client'
import { exportUser, exportUserPrepared, UserExport } from './userService'
import { PaginationResult } from "./paginationResultService"

interface PostExport {
    id: number
    createdBy: UserExport
    createdAt: number
    text: string
    attachements: any
    likeCount: number
    hasLiked?: boolean
    replyTo?: PostExport | number
    repostOf?: PostExport | number
}

async function exportPost(post: Post, user: User = null, isNested: boolean = false): Promise<PostExport> {
    const createdBy = await prisma.user.findUnique({
        where: {
            id: post.createdBy
        }
    })

    const replyTo = (post.replyTo && !isNested) ? await prisma.post.findUnique({
        where: {
            id: post.replyTo
        }
    }) : null

    const repostOf = (post.repostOf && !isNested) ? await prisma.post.findUnique({
        where: {
            id: post.repostOf
        }
    }) : null

    const likeCount = await prisma.postLike.count({
        where: {
            postId: post.id
        }
    })

    const hasLiked = user ? (await prisma.postLike.findUnique({
        where: {
            postId_userId: {
                userId: user.id,
                postId: post.id
            }
        }
    })) != null : undefined;

    return exportPostPrepared(post, await exportUser(createdBy), likeCount, hasLiked, replyTo ? await exportPost(replyTo, user, true) : (isNested ? (post.replyTo || undefined) : undefined), repostOf ? await exportPost(repostOf, user, true) : (isNested ? (post.repostOf || undefined) : undefined))
}

function exportPostPrepared(post: Post, createdBy: UserExport, likeCount: number, hasLiked: boolean = undefined, replyTo: PostExport | number = undefined, repostOf: PostExport | number = undefined) {
    return {
        id: post.id,
        createdBy: createdBy,
        createdAt: post.createdAt.getTime(),
        text: post.text,
        attachements: post.attachements,
        likeCount: likeCount,
        hasLiked: hasLiked,
        replyTo: replyTo,
        repostOf: repostOf
    }
}

async function createPost(user: User, text: string, attachements, replyTo?: Post, repostOf?: Post): Promise<Post> {
    const post = await prisma.post.create({
        data: {
            createdBy: user.id,
            text: text,
            attachements: attachements,
            replyTo: replyTo?.id,
            repostOf: repostOf?.id
        }
    })

    return post
}

async function createPostMiddleware(req, res, next) {
    const requiredKeys = ["text"]
    const keysAvailable = requiredKeys.every((key) => req.body[key])

    if (!keysAvailable)
        return res.status(500).json({
            error: "missing keys",
        })

    const text: string = req.body.text
    const attachements = req.body.attachements || []
    const replyToId: string | null = req.body.replyToId || null
    const repostOfId: string | null = req.body.repostOfId || null
    const user: User = req.user

    let replyTo: Post
    let repostOf: Post

    if (!isStringValid(text, 0, 400))
        return res.status(500).json({
            error: "invalid text",
        })

    if(replyToId) {
        replyTo = await prisma.post.findUnique({
            where: {
                id: parseInt(replyToId)
            }
        })

        if(replyTo == null)
            return res.status(500).json({
                error: "invalid in reply to"
            })
    }
    
    if(repostOfId) {
        repostOf = await prisma.post.findUnique({
            where: {
                id: parseInt(repostOfId)
            }
        })

        if(repostOf == null)
            return res.status(500).json({
                error: "invalid repost of"
            })
    }

    try {
        req.data = await createPost(user, text, attachements, replyTo, repostOf)
        next()
    } catch (exception) {
        console.log(exception)
        return res.status(500).json({
            error: exception
        })
    }
}

async function getPost(id: number): Promise<Post> {
    return await prisma.post.findUnique({
        where: {
            id: id
        }
    })
}

async function getPostMiddleware(req, res, next) {
    const id: string = req.params.id

    try {
        const post = await getPost(parseInt(id))

        if(!post)
            return res.status(404).json({
                error: "unknown post"
            })

        req.data = post    
        next()
    } catch (exception) {
        console.log(exception)
        return res.status(500).json({
            error: exception
        })
    }
}

async function deletePost(post: Post) {
    await prisma.postLike.deleteMany({
        where: {
            postId: post.id
        }
    })

    await prisma.post.delete({
        where: {
            id: post.id
        }
    })
}

async function deletePostMiddleware(req, res, next) {
    const id: string = req.params.id

    try {
        const user: User = req.user
        const post = await getPost(parseInt(id))

        if(!post)
            return res.status(404).json({
                error: "unknown post"
            })

        if(post.createdBy !== user.id)
            return res.status(403).json({
                error: "no permission"
            })

        await deletePost(post)
        next()
    } catch (exception) {
        console.log(exception)
        return res.status(500).json({
            error: exception
        })
    }
}

async function likeUnlikePost(like: boolean, post: Post, user: User) {
    if(like)
        await prisma.postLike.upsert({
            where: {
                postId_userId: {
                    postId: post.id,
                    userId: user.id
                }
            },
            update: {},
            create: {
                postId: post.id,
                userId: user.id
            }
        })
    else
        await prisma.postLike.deleteMany({
            where: {
                AND: {
                    postId: post.id,
                    userId: user.id
                }
            }
        })
}

async function likeUnlikePostMiddleware(like: boolean, req, res, next) {
    try {
        const user: User = req.user
        const post: Post = req.data

        await likeUnlikePost(like, post, user)
        req.data = post
        next()
    } catch (exception) {
        console.log(exception)
        return res.status(500).json({
            error: exception
        })
    }
}

async function likePostMiddleware(req, res, next) {
    likeUnlikePostMiddleware(true, req, res, next)
}

async function unlikePostMiddleware(req, res, next) {
    likeUnlikePostMiddleware(false, req, res, next)
}

async function convertPostsToPostExport(data: any[], requester?: User): Promise<PostExport[]> {
    let postIds = [];
    let userIds = [];

    for(const post of data) {
        let id = post.id
        let userId = post.createdBy

        if(postIds.indexOf(id) === -1) postIds.push(id)
        if(userIds.indexOf(userId) === -1) userIds.push(userId)
        
        if(post.replyToPost) {
            id = post.replyToPost.id
            userId = post.createdBy

            if(postIds.indexOf(id) === -1) postIds.push(id)
            if(userIds.indexOf(userId) === -1) userIds.push(userId)
        }
        
        if(post.repostOfPost) {
            id = post.repostOfPost.id
            userId = post.createdBy

            if(postIds.indexOf(id) === -1) postIds.push(id)
            if(userIds.indexOf(userId) === -1) userIds.push(userId)
        }
    }

    let postStats: { [id: number]: { likeCount: number, hasLiked?: boolean }} = {}
    let userStats: { [id: number]: { followerCount: number, followingCount: number, postCount: number, isFollowing?: boolean, isFollowingBack?: boolean }} = {}
    
    const postStatsResult = await prisma.post.findMany({
        where: {
            id: {
                in: postIds
            }
        },
        select: {
            id: true,
            _count: {
                select: {
                    postLike: true
                },
            },
            postLike: requester ? {
                where: {
                    userId: requester.id
                }
            } : undefined
        }
    })

    for(const postId of postIds) {
        let likeCount = 0
        let hasLiked = undefined

        for(const post of postStatsResult)
            if(post.id === postId) {
                likeCount = post._count.postLike

                if(requester)
                    hasLiked = post.postLike.length > 0
            }

        postStats[postId] = {
            likeCount: likeCount,
            hasLiked: hasLiked
        }
    }
    
    const userStatsResult = await prisma.user.findMany({
        where: {
            id: {
                in: userIds
            }
        },
        select: {
            id: true,
            _count: {
                select: {
                    post: true,
                    followFrom: true,
                    followTo: true
                },
            },
            followFrom: requester ? {
                where: {
                    followTo: requester.id
                }
            } : undefined,
            followTo: requester ? {
                where: {
                    followFrom: requester.id
                }
            } : undefined
        }
    })

    for(const userId of userIds) {
        let postCount = 0
        let followerCount = 0
        let followingCount = 0
        let isFollowing = undefined
        let isFollowingBack = undefined

        for(const user of userStatsResult)
            if(user.id === userId) {
                postCount = user._count.post
                followerCount = user._count.followTo
                followingCount = user._count.followFrom

                if(requester) {
                    isFollowing = user.followTo.length > 0
                    isFollowingBack = user.followFrom.length > 0
                }
            }

        userStats[userId] = {
            postCount: postCount,
            followerCount: followerCount,
            followingCount: followingCount,
            isFollowing: isFollowing,
            isFollowingBack: isFollowingBack 
        }
    }
    
    const output: PostExport[] = []

    for(const post of data) {
        let replyToPostExport: PostExport
        let repostOfPostExport: PostExport

        if(post.replyToPost && postStats[post.replyToPost.id] && userStats[post.replyToPost.user.id]) {
            const _postStats = postStats[post.replyToPost.id]
            const _userStats = userStats[post.replyToPost.user.id]

            const exportedUser = exportUserPrepared(post.replyToPost.user, false, _userStats.followerCount, _userStats.followingCount, _userStats.postCount, _userStats.isFollowing, _userStats.isFollowingBack)
            replyToPostExport = exportPostPrepared(post.replyToPost, exportedUser, _postStats.likeCount, _postStats.hasLiked)
        }

        if(post.repostOfPost && postStats[post.repostOfPost.id] && userStats[post.repostOfPost.user.id]) {
            const _postStats = postStats[post.repostOfPost.id]
            const _userStats = userStats[post.repostOfPost.user.id]

            const exportedUser = exportUserPrepared(post.repostOfPost.user, false, _userStats.followerCount, _userStats.followingCount, _userStats.postCount, _userStats.isFollowing, _userStats.isFollowingBack)
            repostOfPostExport = exportPostPrepared(post.repostOfPost, exportedUser, _postStats.likeCount, _postStats.hasLiked)
        }

        if(postStats[post.id] && userStats[post.user.id]) {
            const _postStats = postStats[post.id]
            const _userStats = userStats[post.user.id]

            const exportedUser = exportUserPrepared(post.user, false, _userStats.followerCount, _userStats.followingCount, _userStats.postCount, _userStats.isFollowing, _userStats.isFollowingBack)
            const postExport = exportPostPrepared(post, exportedUser, _postStats.likeCount, _postStats.hasLiked, replyToPostExport, repostOfPostExport)
        
            output.push(postExport)
        }
    }

    return output
}

async function getPostsFromUser(user: User, requester?: User, paginationResult?: PaginationResult): Promise<PaginationResult> {
    if(!paginationResult) paginationResult = { limit: 20, page: 0 }

    const posts = await prisma.post.findMany({
        take: paginationResult.limit + 1,
        skip: paginationResult.limit * paginationResult.page,
        where: {
            createdBy: user.id
        },
        include: {
            replyToPost: {
                include: {
                    user: true
                }
            },
            repostOfPost: {
                include: {
                    user: true
                }
            },
            user: true
        }
    })

    const postCount = await prisma.post.count({
        where: {
            createdBy: user.id
        }
    })

    const output = await convertPostsToPostExport(posts, requester)

    paginationResult.total = postCount
    paginationResult.moreAvailable = posts.length > paginationResult.limit
    paginationResult.results = output.slice(0, paginationResult.limit)

    return paginationResult
}

async function getPostsFromUserMiddleware(req, res, next) {
    const paginationResult: PaginationResult = req.paginationResult
    const user: User = req.data

    req.data = await getPostsFromUser(user, req.user, paginationResult)
    next()
} 

async function getHomeTimeline(user: User, paginationResult?: PaginationResult): Promise<PaginationResult> {
    if(!paginationResult) paginationResult = { limit: 20, page: 0 }

    const posts = await prisma.post.findMany({
        take: paginationResult.limit + 1,
        skip: paginationResult.limit * paginationResult.page,
        where: {
            user: {
                followTo: {
                    every: {
                        followFrom: user.id
                    }
                }
            }
        },
        include: {
            replyToPost: {
                include: {
                    user: true
                }
            },
            repostOfPost: {
                include: {
                    user: true
                }
            },
            user: {
                include: {
                    followTo: true
                }
            }
        }
    })

    const postCount = await prisma.post.count({
        where: {
            user: {
                followTo: {
                    every: {
                        followFrom: user.id
                    }
                }
            }
        }
    })

    const output = await convertPostsToPostExport(posts, user)

    paginationResult.total = postCount
    paginationResult.moreAvailable = posts.length > paginationResult.limit
    paginationResult.results = output.slice(0, paginationResult.limit)

    return paginationResult
}

async function getHomeTimelineMiddleware(req, res, next) {
    const paginationResult: PaginationResult = req.paginationResult

    req.data = await getHomeTimeline(req.user, paginationResult)
    next()
} 


export {
    exportPost,
    createPost,
    createPostMiddleware,
    getPost,
    getPostMiddleware,
    deletePost,
    deletePostMiddleware,
    likeUnlikePost,
    likePostMiddleware,
    unlikePostMiddleware,
    getPostsFromUserMiddleware,
    getHomeTimelineMiddleware
}

export type { UserExport }