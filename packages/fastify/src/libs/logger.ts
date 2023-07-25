import type { FastifyBaseLogger } from 'fastify';
// @ts-ignore
import { createLogger } from 'fastify/lib/logger.js';
import type { LoggerOptions as PinoLoggerOptions } from 'pino';


// logger config for global use, use fastify logger first
export const LOGGER_CONFIG: PinoLoggerOptions = process.env.NODE_ENV === 'production' ? {} : {
    transport: {
        target: 'fastify-pino-pretty',
    },
};


// Logger for before fastify init
export const {
    logger,
    hasLogger,
} = createLogger({ logger: LOGGER_CONFIG }) as {
    logger: FastifyBaseLogger,
    hasLogger: boolean
};
