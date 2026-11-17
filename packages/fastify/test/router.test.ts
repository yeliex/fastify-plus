import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import Fastify from 'fastify';
import RouterLoaderPlugin from '../src/plugins/router/index.js';

for (const ext of ['mjs', 'ts']) {
    test(`loads ${ext} routes from paths containing URL special characters`, async (t) => {
        const cacheDir = resolve('node_modules/.cache');
        await mkdir(cacheDir, { recursive: true });
        const dir = await mkdtemp(resolve(cacheDir, 'router 中文 #%-'));
        t.after(() => rm(dir, { recursive: true, force: true }));

        await writeFile(resolve(dir, `route.${ext}`), `
export const prefix = '/custom';
export default async function route(fastify) {
    fastify.get('/route', async () => ({ loaded: true }));
}
`);

        const app = Fastify();
        t.after(() => app.close());
        app.register(RouterLoaderPlugin, { dir, ext: [ext] });

        const response = await app.inject('/custom/route');
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.json(), { loaded: true });
    });
}
