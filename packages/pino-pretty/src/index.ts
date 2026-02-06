import { gray } from 'colorette';
import { EOL } from 'os';
import type pino from 'pino';
import pretty, { type PrettyOptions } from 'pino-pretty';

export const messageFormat = (log: pino.LogDescriptor, messageKey: string) => {
    const messages = [];

    if (!log.reqId) {
        messages.push(log[messageKey] as string);
    } else {
        if (log.reqId) {
            messages.unshift(`[${log.reqId}]`);
            delete log.reqId;
        }

        let msg = log[messageKey];

        if (msg === 'incoming request') {
            msg = '→';
            messages.unshift(msg);
        } else if (msg === 'request completed') {
            msg = '←';
            messages.unshift(msg);
        } else {
            messages.push(msg);
        }

        if (log.req) {
            const { req } = log as any;

            messages.push(
                req.method,
                req.url,
            );

            delete log.req;
        }

        if (log.res) {
            const { res } = log as any;

            messages.push(`${res.statusCode}`);

            if (log.responseTime) {
                messages.push(`(${Number(log.responseTime).toFixed(3)}ms)`);
                delete log.responseTime;
            }

            delete log.res;
        }
    }

    if (log.err) {
        (log.err as any).stack && messages.push(EOL + gray((log.err as any).stack.toString()) + EOL);
        delete log.err;
    }

    const tags: string[] = [];

    if (log.topic) {
        tags.push(gray(`[topic=${log.topic}]`));
        delete log.topic;
    }
    if (log.type) {
        tags.push(gray(`[type=${log.type}]`));
        delete log.type;
    }
    if (log.name) {
        tags.push(gray(`[name=${log.name}]`));
        delete log.name;
    }

    if (tags.length) {
        messages.unshift(tags.join(''));
    }

    return messages.join(' ');
};

const build = (options: PrettyOptions) => {
    return pretty({
        messageFormat,
        ignore: 'pid,hostname,topic',
        ...options,
    });
};

export default build;
