/**
 * Fix for req-typescript-properties because
 * the original request type does not have
 * parameters like user, data, ...
 */
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