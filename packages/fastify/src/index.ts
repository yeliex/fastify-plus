import fastifyAccepts from '@fastify/accepts';
import fastifyCookie from '@fastify/cookie';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fastify, type FastifyServerOptions } from 'fastify';
import type { PinoLoggerOptions } from 'fastify/types/logger.js';
import { createWriteStream, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import defaults from 'lodash.defaults';
import { resolve } from 'path';
import SerializeResponsePlugin from './plugins/response/index.js';
import RouterRegisterPlugin from './plugins/router/index.js';

export const DEFAULT_LOGGER_CONFIG = process.env.NODE_ENV === 'production' ? {} : {
    transport: {
        target: 'fastify-pino-pretty',
    },
};

export const DEFAULT_REQUEST_ID_HEADER = 'x-request-id';

interface CreateServer extends FastifyServerOptions {
    baseDir?: string;
    workDir?: string;
    runtimeDir?: string;
    logger?: PinoLoggerOptions;
}

declare module 'fastify' {
    interface FastifyInstance {
        baseDir: string;
        runtimeDir: string;
        workDir: string;
    }
}

const CWD = process.cwd();

export const DEFAULT_OPTIONS: FastifyServerOptions = {
    logger: DEFAULT_LOGGER_CONFIG,
    requestIdHeader: DEFAULT_REQUEST_ID_HEADER,
};

const createServer = (options: CreateServer = {}) => {
    const {
        baseDir = CWD,
        workDir = CWD,
        runtimeDir = resolve(workDir, '.run'),
        ...extraOptions
    } = options;

    mkdirSync(runtimeDir, { recursive: true });

    const RUNTIME_FILE = resolve(runtimeDir, 'runtime');
    const PID_FILE = resolve(runtimeDir, 'pid');

    const app = fastify(defaults(
        {}, extraOptions, DEFAULT_OPTIONS,
    )).withTypeProvider<TypeBoxTypeProvider>();

    app.baseDir = baseDir;
    app.runtimeDir = runtimeDir;
    app.workDir = workDir;

    app.log.info('baseDir: %s', app.baseDir);
    app.log.info('workDir: %s', app.workDir);
    app.log.info('runtimeDir: %s', app.runtimeDir);

    app.register(fastifyAccepts);
    app.register(fastifyCookie);
    app.register(SerializeResponsePlugin);

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
        app.register(RouterRegisterPlugin, { dir: resolve(app.baseDir, 'routes') });

        return listen.call(app, ...args as [any, any, any]);
    }) as any;

    return app;
};

export default createServer;
