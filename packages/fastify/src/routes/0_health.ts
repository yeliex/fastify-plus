import type { FastifyPluginAsync } from 'fastify';
import type { RegisterOptions } from 'fastify/types/register.js';

const HealthRouter: FastifyPluginAsync = async (fastify) => {
    fastify.all('/health', async (_, reply) => {
        reply.status(204);
    });
};

export const prefix = '/_';

export const options: RegisterOptions = {
    logLevel: 'silent',
};

export default HealthRouter;
