import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Stream } from 'stream';

export const DEFAULT_LOGGER_CONFIG = process.env.NODE_ENV === 'production' ? {} : {
    transport: {
        target: 'fastify-pino-pretty',
    },
};

export const DEFAULT_REQUEST_ID_HEADER = 'x-request-id';


const ERROR_AS_STATUS = [
    401,
];

export const defaultReplySerializer = (payload: unknown, statusCode: number) => {
    if (typeof payload === 'string' || payload instanceof Buffer || payload instanceof Stream) {
        return payload as string;
    }

    if (
        statusCode !== 200 ||
        (payload && typeof payload === 'object' && 'code' in payload)
    ) {
        return JSON.stringify(payload);
    }

    return JSON.stringify({
        code: statusCode,
        data: payload,
    });
};

export const defaultNotFoundHandler = (_request: FastifyRequest, reply: FastifyReply) => {
    reply.statusCode = 404;
    reply.send({
        code: 404,
        message: 'not found',
        error: 'NotFound',
    });
};

export const defaultErrorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    let code = error.statusCode;
    let subcode = 0;

    if (!code && typeof error.code === 'number') {
        if (error.code < 400 || error.code >= 600) {
            code = 500;
            subcode = error.code;
        } else {
            code = error.code;
        }
    }

    if (!code) {
        code = 500;
    }

    request.log.error(error);

    reply.code(ERROR_AS_STATUS.includes(code) ? code : 200);

    reply.send(JSON.stringify({
        code,
        subcode,
        error: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    }));
};
