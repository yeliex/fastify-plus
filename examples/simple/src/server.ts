import { type TypeBoxTypeProvider, TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import createServer from '@yeliex/fastify';
import { Type } from 'typebox';
import { fileURLToPath } from 'url';

const BASE_DIR = fileURLToPath(new URL('.', import.meta.url));

const server = createServer({
    baseDir: BASE_DIR,
}).setValidatorCompiler(TypeBoxValidatorCompiler).withTypeProvider<TypeBoxTypeProvider>();

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
