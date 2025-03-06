import type { FastifyPluginAsync } from 'fastify';
import * as process from 'process';

const SystemRouter: FastifyPluginAsync = async (fastify) => {
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
        version: ${fastify.version}
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

    fastify.get('/bad_request', (_, reply) => {
        const error = new Error('bad request') as any;
        error.code = 400;
        reply.status(400);
        reply.send(error);
    });

    fastify.get('/buffer', () => {
        return Buffer.from('123');
    });

    fastify.get('/buffer/json', (_,reply) => {
        return reply.json(Buffer.from('123'));
    });

    fastify.get('/empty', async (_, reply) => {
        reply.code(204);
    });

    fastify.get('/string', async () => {
        return 'string';
    });

    fastify.get('/string/json', async (_, reply) => {
        return reply.json('string');
    });


    fastify.get('/number', async () => {
        return 123456789;
    });

    fastify.get('/number/json', async (_, reply) => {
        return reply.json(123456789);
    });

    fastify.get('/boolean', async () => {
        return false;
    });

    fastify.get('/boolean/json', async (_, reply) => {
        return reply.json(false);
    });

    fastify.get('/null', async () => {
        return null;
    });

    fastify.get('/null/json', async (_, reply) => {
        reply.json(null);
    });
};

export const prefix = '/_';

export default SystemRouter;
