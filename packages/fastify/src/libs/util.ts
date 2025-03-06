import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
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

export const errorToResponse = (error: Error | FastifyError) => {
    let statusCode = 500;
    const body = {
        code: 500,
        error: {
            code: undefined as string | undefined | number,
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        },
    };

    if ('statusCode' in error) {
        statusCode = error.statusCode || 500;
        body.code = statusCode;
        body.error.code = error.code;
    } else {
        const { code = 500, subcode } = error as any as {
            code?: number,
            subcode?: number | string
        };
        if (isNaN(Number(code)) || code < 100 || code > 599) {
            statusCode = 500;
            if (!subcode) {
                body.code = code;
            } else {
                body.error.code = subcode;
            }
        } else {
            statusCode = code;
            body.error.code = subcode;
        }
    }

    return [
        ERROR_AS_STATUS.includes(statusCode) ? statusCode as number : 200,
        body,
    ] as const;
};

export const defaultErrorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const [statusCode, errorBody] = errorToResponse(error);

    request.log.error(error);

    reply.statusCode === 200 && statusCode !== reply.statusCode && reply.code(statusCode);

    reply.type('application/json').send(errorBody);
};

export const isInvalidJsonPayload = (payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) {
        return undefined;
    }

    if (Buffer.isBuffer(payload)) {
        return 'Buffer';
    }

    if (payload instanceof Stream) {
        return 'Stream';
    }

    if (payload instanceof ReadableStream) {
        return 'ReadableStream';
    }

    if (payload instanceof Response) {
        return 'Response';
    }

    if (isTypedArray(payload)) {
        return 'TypedArray';
    }

    if (isAnyArrayBuffer(payload)) {
        return 'ArrayBuffer';
    }

    return undefined;
};

export const serializeReply = (payload: unknown, statusCode: number) => {
    if (payload instanceof Error) {
        return JSON.stringify(errorToResponse(payload)[1]);
    }

    return JSON.stringify({
        code: statusCode,
        data: payload,
    });
};

export const defaultNotFoundHandler = (request: FastifyRequest, reply: FastifyReply) => {
    const accept = request.accepts();
    const { url, method } = request.raw;
    const message = `Route ${method}:${url} not found`;

    if (accept.type(['json', 'text', 'html']) === 'json') {
        reply.status(404).send(errorToResponse({
            statusCode: 404,
            name: 'NotFoundError',
            message,
        })[1]);
    } else if (accept.type(['text', 'html']) === 'html') {
        reply.status(404).type('html').send(`<h1>Not Found</h1>\n<p>${message}</p>`);
    } else {
        reply.status(404).send(`Not Found\n${message}`);
    }
};
