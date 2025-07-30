import fastifyAccepts from '@fastify/accepts';
import fastifyCookie from '@fastify/cookie';
import * as fastify from 'fastify';
import type { PinoLoggerOptions } from 'fastify/types/logger.js';
import { createWriteStream, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import defaults from 'lodash.defaults';
import type * as http from 'node:http';
import type * as http2 from 'node:http2';
import type * as https from 'node:https';
import { resolve } from 'path';
import {
    DEFAULT_LOGGER_CONFIG,
    DEFAULT_REQUEST_ID_HEADER,
    defaultErrorHandler,
    defaultNotFoundHandler,
} from './libs/util.js';
import ResponsePlugin from './plugins/response/index.js';
import RouterRegisterPlugin from './plugins/router/index.js';

const CWD = process.cwd();

export const DEFAULT_OPTIONS = {
    logger: DEFAULT_LOGGER_CONFIG,
    requestIdHeader: DEFAULT_REQUEST_ID_HEADER,
} satisfies fastify.FastifyServerOptions;

interface CreateServerBaseOptions {
    baseDir?: string;
    workDir?: string;
    runtimeDir?: string;
    defaultReplySerializer?: Parameters<fastify.FastifyInstance['setReplySerializer']>[0];
    defaultErrorHandler?: boolean | Parameters<fastify.FastifyInstance['setErrorHandler']>[0];
    defaultNotFoundHandler?: boolean | Parameters<fastify.FastifyInstance['setNotFoundHandler']>[0];
    logger?: PinoLoggerOptions;
    autoRegisterRoutes?: boolean | 'internal';
}

declare module 'fastify' {
    interface FastifyInstance {
        baseDir: string;
        runtimeDir: string;
        workDir: string;
    }
}

export type CreateServerHttpOptions<Server extends http.Server, Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger> =
    fastify.FastifyHttpOptions<Server, Logger> & CreateServerBaseOptions;

export type CreateServerHttpsOptions<Server extends https.Server, Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger> =
    fastify.FastifyHttpsOptions<Server, Logger> & CreateServerBaseOptions;

export type CreateServerHttp2Options<Server extends http2.Http2Server, Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger> =
    fastify.FastifyHttp2Options<Server, Logger> & CreateServerBaseOptions;

export type CreateServerHttp2SecureOptions<Server extends http2.Http2SecureServer, Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger> =
    fastify.FastifyHttp2SecureOptions<Server, Logger> & CreateServerBaseOptions;

function createServer<
    Server extends http.Server,
    Request extends fastify.RawRequestDefaultExpression<Server> = fastify.RawRequestDefaultExpression<Server>,
    Response extends fastify.RawReplyDefaultExpression<Server> = fastify.RawReplyDefaultExpression<Server>,
    Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger,
    TypeProvider extends fastify.FastifyTypeProvider = fastify.FastifyTypeProviderDefault,
>(options?: CreateServerHttpOptions<Server, Logger>): fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider> & PromiseLike<fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider>>;
function createServer<
    Server extends https.Server,
    Request extends fastify.RawRequestDefaultExpression<Server> = fastify.RawRequestDefaultExpression<Server>,
    Response extends fastify.RawReplyDefaultExpression<Server> = fastify.RawReplyDefaultExpression<Server>,
    Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger,
    TypeProvider extends fastify.FastifyTypeProvider = fastify.FastifyTypeProviderDefault,
>(options?: CreateServerHttpsOptions<Server, Logger>): fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider> & PromiseLike<fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider>>;

function createServer<
    Server extends http2.Http2Server,
    Request extends fastify.RawRequestDefaultExpression<Server> = fastify.RawRequestDefaultExpression<Server>,
    Response extends fastify.RawReplyDefaultExpression<Server> = fastify.RawReplyDefaultExpression<Server>,
    Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger,
    TypeProvider extends fastify.FastifyTypeProvider = fastify.FastifyTypeProviderDefault,
>(options?: CreateServerHttp2Options<Server, Logger>): fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider> & PromiseLike<fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider>>;

function createServer<
    Server extends http2.Http2SecureServer,
    Request extends fastify.RawRequestDefaultExpression<Server> = fastify.RawRequestDefaultExpression<Server>,
    Response extends fastify.RawReplyDefaultExpression<Server> = fastify.RawReplyDefaultExpression<Server>,
    Logger extends fastify.FastifyBaseLogger = fastify.FastifyBaseLogger,
    TypeProvider extends fastify.FastifyTypeProvider = fastify.FastifyTypeProviderDefault,
>(options?: CreateServerHttp2SecureOptions<Server, Logger>): fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider> & PromiseLike<fastify.FastifyInstance<Server, Request, Response, Logger, TypeProvider>>;
function createServer(options: CreateServerBaseOptions = {}): fastify.FastifyInstance & PromiseLike<fastify.FastifyInstance> {
    const {
        baseDir = CWD,
        workDir = CWD,
        runtimeDir = resolve(workDir, '.run'),
        defaultErrorHandler: setDefaultErrorHandler = true,
        defaultNotFoundHandler: setDefaultNotFoundHandler = true,
        defaultReplySerializer: setDefaultReplySerializer,
        autoRegisterRoutes = true,
        ...extraOptions
    } = options;

    mkdirSync(runtimeDir, { recursive: true });

    const RUNTIME_FILE = resolve(runtimeDir, 'runtime');
    const PID_FILE = resolve(runtimeDir, 'pid');

    const app = fastify.fastify(defaults(
        {}, extraOptions, DEFAULT_OPTIONS,
    ));

    app.baseDir = baseDir;
    app.runtimeDir = runtimeDir;
    app.workDir = workDir;

    app.log.info('baseDir: %s', app.baseDir);
    app.log.info('workDir: %s', app.workDir);
    app.log.info('runtimeDir: %s', app.runtimeDir);

    setDefaultErrorHandler && app.setErrorHandler(
        typeof setDefaultErrorHandler === 'function'
            ? setDefaultErrorHandler
            : defaultErrorHandler,
    );
    setDefaultNotFoundHandler && app.setNotFoundHandler(
        typeof setDefaultNotFoundHandler === 'function'
            ? setDefaultNotFoundHandler
            : defaultNotFoundHandler,
    );
    setDefaultReplySerializer && app.setReplySerializer(setDefaultReplySerializer);

    app.register(fastifyAccepts);
    app.register(fastifyCookie);
    app.register(ResponsePlugin);

    app.addHook('onSend', async (request, reply) => {
        reply.header('x-request-id', request.id);
    });

    app.addHook('onReady', async () => {
        const stream = createWriteStream(RUNTIME_FILE, { flags: 'w' });

        stream.write('======FRAMEWORK======\r');
        stream.write(`baseDir: ${app.baseDir}\r`);
        stream.write(`workDir: ${app.workDir}\r`);
        stream.write(`runtimeDir: ${app.runtimeDir}\r`);
        stream.write('\r======PLUGINS======\r');
        stream.write(app.printPlugins());
        stream.write('\r======ROUTERS======\r');
        stream.write(app.printRoutes({
            includeHooks: true,
            includeMeta: true,
            commonPrefix: false,
        }));

        stream.end();

        await writeFile(PID_FILE, `${process.pid}`);
    });

    const listen = app.listen;

    app.listen = (async (...args: any[]) => {
        await app.after();
        app.register(RouterRegisterPlugin, { dir: resolve(app.baseDir, 'routes'), autoRegisterRoutes });

        return (listen as any).call(app, ...args);
    }) as any;

    return app;
}

export default createServer;
