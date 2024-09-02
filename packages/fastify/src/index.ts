import createServer from './server.js';

export default createServer;

export {
    default as createServer, DEFAULT_OPTIONS, DEFAULT_LOGGER_CONFIG, DEFAULT_REQUEST_ID_HEADER,
} from './server.js';
export {
    errorHandler, notFoundHandler, replySerializer, default as SerializeResponsePlugin,
} from './plugins/response/index.js';
export { default as RouterLoaderPlugin } from './plugins/router/index.js';
