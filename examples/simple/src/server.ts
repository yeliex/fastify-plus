import createServer, { defaultErrorHandler, defaultNotFoundHandler, defaultReplySerializer } from '@yeliex/fastify';
import { fileURLToPath } from 'url';

const BASE_DIR = fileURLToPath(new URL('.', import.meta.url));

const server = createServer({
    baseDir: BASE_DIR,
});

server.listen({
    port: 3000,
    host: '0.0.0.0',
});

server.setReplySerializer(defaultReplySerializer);
server.setErrorHandler(defaultErrorHandler);
server.setNotFoundHandler(defaultNotFoundHandler);

export default server;
