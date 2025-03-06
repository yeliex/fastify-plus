import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import createServer from '@yeliex/fastify';
import { fileURLToPath } from 'url';

const BASE_DIR = fileURLToPath(new URL('.', import.meta.url));

const server = createServer({
    baseDir: BASE_DIR,
}).withTypeProvider<TypeBoxTypeProvider>();

server.listen({
    port: 3000,
    host: '0.0.0.0',
});

server.get('/test', {
    schema: {
        querystring: Type.Object({
            id: Type.Integer(),
        }),
    },
}, async (request, reply) => {
    return reply.send({
        requestId: request.id,
        id: request.query.id,
    });
});

export default server;
