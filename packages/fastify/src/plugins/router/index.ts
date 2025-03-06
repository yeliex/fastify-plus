import glob from 'fast-glob';
import type { FastifyPluginAsync } from 'fastify';
import plugin from 'fastify-plugin';
import { resolve } from 'path';

const internalRoutes = [
    () => import('../../routes/0_health.js'),
    () => import('../../routes/99_system.js'),
];

const AVAILABLE_EXT = process.env.NODE_ENV === 'production'
    ? ['cjs', 'mjs', 'js']
    : ['mts', 'cts', 'ts'];

const RouterLoaderPlugin: FastifyPluginAsync<{
    dir?: string;
    ext?: string[]
}> = async (fastify, opts = {}) => {
    const { dir = resolve(fastify.baseDir, 'routes'), ext = AVAILABLE_EXT } = opts;

    const load = async (BASE: string, exts: string[]) => {
        const globExts = exts.map(ext => ext.replace(/^\.?/, ''));
        const pattern = globExts.length > 1 ? `**/*.{${globExts.join(',')}}` : `**/*.${globExts}`;

        fastify.log.info(`register routes from ${BASE}, pattern ${pattern}`);

        const files = await glob(pattern, {
            ignore: ['*.d.ts'],
            dot: false,
            cwd: BASE,
            throwErrorOnBrokenSymbolicLink: true,
        });

        for (const file of files) {
            fastify.log.info('register route %s', file);

            const route = await import(`${resolve(BASE, file)}`);

            fastify.register(route.default, {
                ...(route.options || {}),
                prefix: route.prefix,
            });
        }
    };

    for (const loadInternalRoute of internalRoutes) {
        const route: any = await loadInternalRoute();

        fastify.log.info('register internal route %s', route.default.name);
        fastify.register(route.default, {
            ...(route.options || {}),
            prefix: route.prefix,
        });
    }

    await load(dir, ext);
};

export default plugin(RouterLoaderPlugin);
