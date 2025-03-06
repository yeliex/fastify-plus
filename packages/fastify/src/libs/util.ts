import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import isPlainObject from 'lodash.isplainobject';
import { ReadableStream } from 'node:stream/web';
import { isAnyArrayBuffer, isTypedArray } from 'node:util/types';
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

export const defaultNotFoundHandler = (_request: FastifyRequest, reply: FastifyReply) => {
    reply.statusCode = 404;
    reply.send({
        code: 404,
        message: 'not found',
        error: 'NotFound',
    });
};

export const errorToResponse = (error: Error | FastifyError) => {
    const code = 'statusCode' in error ? error.statusCode : 500;

    return [
        code && ERROR_AS_STATUS.includes(code) ? code : 200,
        {
            code,
            error: {
                code: 'code' in error ? error.code : undefined,
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            },
        },
    ] as const;
};

export const defaultErrorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const [statusCode, errorBody] = errorToResponse(error);

    request.log.error(error);

    reply.statusCode === 200 && statusCode !== reply.statusCode && reply.code(statusCode);

    reply.send(errorBody);
};

export const serializeReply = (payload: unknown, statusCode: number) => {
    if (Buffer.isBuffer(payload)
        || payload instanceof Stream
        || payload instanceof ReadableStream
        || payload instanceof Response
        || isTypedArray(payload)
        || isAnyArrayBuffer(payload)
    ) {
        // todo: update type
        return payload as any as string;
    }

    if (payload instanceof Error) {
        return JSON.stringify(errorToResponse(payload)[1]);
    }

    if (
        // has explicit set status code
        statusCode !== 200 ||
        (isPlainObject(payload) && 'code' in (payload as {}))
    ) {
        return JSON.stringify(payload);
    }

    return JSON.stringify({
        code: statusCode,
        data: payload,
    });
};

export const defaultReplySerializer = (payload: unknown, statusCode: number) => {
    return serializeReply(payload, statusCode);
};

