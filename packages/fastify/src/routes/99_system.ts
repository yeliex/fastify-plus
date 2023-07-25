import { FastifyPluginAsync } from 'fastify';
import * as process from 'process';

const SystemModule: FastifyPluginAsync = async (fastify) => {
    if (process.env.NODE_ENV === 'production') {
        return;
    }

    fastify.get('/system', async () => {
        return {
            version: fastify.version,
        };
    });

    fastify.get('/print', async (_, reply) => {
        reply.send(`
        ======PLUGINS======
        ${fastify.printPlugins()}

        ======ROUTERS======
        ${fastify.printRoutes({ includeHooks: true, includeMeta: true })}
        `);
    });

    fastify.get('/exception', () => {
        throw new Error('exception error');
    });

    fastify.get('/not_found', (_, reply) => {
        reply.callNotFound();
    });

    fastify.get('/bad_request', () => {
        const error = new Error('bad request') as any;
        error.code = 400;
        throw error;
    });

    fastify.get('/buffer', () => {
        return Buffer.from('123');
    });

    fastify.get('/empty', async (_, reply) => {
        reply.send(undefined);
    });

    fastify.get('/test', async () => {
        return 'string';
    });

    fastify.get('/number', async () => {
        return 123456789;
    });

    fastify.get('/boolean', async () => {
        return false;
    });
};

export const prefix = '/_';

export default SystemModule;
