import type { FastifyPluginAsync } from 'fastify';
import { readdir } from 'fs/promises';
import plugin from 'fastify-plugin';
import { resolve, extname } from 'path';
import * as process from 'process';
import { fileURLToPath } from 'url';

const AVAILABLE_EXT = process.env.NODE_ENV === 'production' ? ['.js', '.mjs'] : ['.ts'];

const FRAMEWORK_BASE = fileURLToPath(new URL('../../', import.meta.url));

const RouterLoaderPlugin: FastifyPluginAsync<{
    dir?: string;
    ext?: string[]
}> = async (fastify, opts = {}) => {
    const { dir = resolve(fastify.baseDir, 'routes'), ext = AVAILABLE_EXT } = opts;

    const load = async (BASE: string, exts: string[]) => {
        fastify.log.info('register routes from %s', BASE);

        const files = await readdir(BASE);

        for (const file of files) {
            const ext = extname(file);

            if (!exts.includes(ext) || ext === '.d.ts') {
                continue;
            }

            fastify.log.info('register route %s', file);

            const route = await import(resolve(BASE, file));

            fastify.register(route.default, {
                ...(route.options || {}),
                prefix: route.prefix,
            });
        }
    };

    await load(resolve(FRAMEWORK_BASE, 'routes'), ['.js']);
    await load(dir, ext);
};

export default plugin(RouterLoaderPlugin);
