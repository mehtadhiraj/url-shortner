export const INTERNAL_SERVER_ERROR = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong!',
    exception: 'InternalServerError',
    status: 500,
};

export const BAD_REQUEST_ERROR = {
    code: `BAD_REQUEST`,
    message: 'Invalid Request',
    exception: 'InvalidRequest',
    status: 400,
};

export const NOT_FOUND_ERROR = {
    code: 'NOT_FOUND',
    message: 'Not Found',
    exception: 'NotFound',
    status: 404,
};


export const UNAUTHORIZED_ERROR = {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
    exception: 'Unauthorized',
    status: 401,
};

export const FORBIDDEN_ERROR = {
    code: 'FORBIDDEN',
    message: 'Forbidden',
    exception: 'Forbidden',
    status: 403,
};

export const TOO_MANY_REQUESTS_ERROR = {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too Many Requests',
    exception: 'TooManyRequests',
    status: 429,
};

export const CONFLICT_ERROR = {
    code: 'CONFLICT',
    message: 'Resource already exists',
    exception: 'ResourceAlreadyExists',
    status: 409,
};