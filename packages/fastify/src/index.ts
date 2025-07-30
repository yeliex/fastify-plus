import createServer from './server.js';

export default createServer;

export { default as createServer, DEFAULT_OPTIONS } from './server.js';

export * from './libs/util.js';

export { default as RouterLoaderPlugin } from './plugins/router/index.js';

// to keep reference in bundled dts
// export { default as fastifyAccepts } from '@fastify/accepts';
// export { default as fastifyCookie } from '@fastify/cookie';
