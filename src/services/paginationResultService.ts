interface PaginationResult {
    limit: number
    page: number
    total?: number
    moreAvailable?: boolean
    results?: any[]
}

function parsePaginationResultMiddleware(defaultLimit: number = 20, maximumLimit: number = 50) {
    return (req, res, next) => {
        let limit = parseInt(req.query.limit) || defaultLimit
        const page = parseInt(req.query.page) || 0

        if(limit < 0)
            return res.status(500).json({
                error: "limit cannot be less than 0"
            })

        if(limit > maximumLimit)
            limit = maximumLimit

        const paginationResult: PaginationResult = {
            limit: limit,
            page: page
        }

        req.paginationResult = paginationResult
        next()
    }
}

export {
    parsePaginationResultMiddleware
}

export type { PaginationResult }