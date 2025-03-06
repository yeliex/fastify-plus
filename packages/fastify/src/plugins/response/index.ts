import type { FastifyPluginAsync } from 'fastify';
import plugin from 'fastify-plugin';
import { ReadableStream } from 'node:stream/web';
import { Stream } from 'stream';
import { serializeReply } from '../../libs/util.js';

declare module 'fastify' {
    interface FastifyReply {
        json<T extends {}>(payload: T, code?: number): void;
    }
}

const ResponsePlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorateReply('json', async function (payload: {}, code = 200) {
        const reply = this;

        if (payload instanceof Stream
            || payload instanceof ReadableStream
            || payload instanceof Response
        ) {
            reply.send(payload);
            return;
        }

        reply.type('application/json; charset=utf-8');

        reply.send(serializeReply(payload, code));
    });
};

export default plugin(ResponsePlugin);
