declare namespace Express {
    export interface Request {
        user?: any
        data?: any,
        paginationResult?: any,
        corePaginationResult?: any,
        posts?: any,
        users?: any
    }
}