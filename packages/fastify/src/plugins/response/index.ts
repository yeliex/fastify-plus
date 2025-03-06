import type { FastifyPluginAsync } from 'fastify';
import plugin from 'fastify-plugin';
import { isInvalidJsonPayload, serializeReply } from '../../libs/util.js';

declare module 'fastify' {
    interface FastifyReply {
        json<T = unknown>(payload: T, code?: number): void;
    }
}

const ResponsePlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorateReply('json', async function (payload, code = 200) {
        const reply = this;

        const payloadType = isInvalidJsonPayload(payload);

        if (payloadType) {
            reply.log.warn(`Invalid JSON payload: ${payloadType}`);
        }

        reply.type('application/json');

        reply.send(serializeReply(payload, code));
    });
};

export default plugin(ResponsePlugin);
