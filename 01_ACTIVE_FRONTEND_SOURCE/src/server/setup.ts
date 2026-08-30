import { warn, info, error, debug } from '@tauri-apps/plugin-log';

export const formatMessage = (...args: any[]) =>
	args.map(arg => {
		if (arg instanceof Error) return [arg.stack ? `\n${arg.stack}` : `\nError: ${arg.message}`, arg.cause ? `\n\t----\n\tCause: ${JSON.stringify(arg.cause, null, 2)}` : undefined].filter(Boolean).join(' ');
		if (typeof arg === 'object') {
			try { return JSON.stringify(arg, null, 2); } catch { return '[object Object]'; }
		}
		if (typeof arg === 'string') return arg.replace(/([a-zA-Z]:\\Users\\)[^\\]+\\/g, '$1<USERNAME>\\').replace(/\/home\/[^/\s]+\//g, '/home/<USERNAME>/');
		return String(arg);
	}).join(' ');

const forwardConsole = (fnName: 'info' | 'warn' | 'error' | 'debug', logger: (message: string) => Promise<void>) => {
	const original = console[fnName];
	console[fnName] = (...args) => {
		if (typeof args[0] === 'string' && (args[0].startsWith('[vite]') || args[0].startsWith('starting new connection') || args[0].includes('RedrawEventsCleared'))) return;
		if (fnName === 'info') {
			console.groupCollapsed(...args);
			original(new Error().stack?.split('\n').slice(2).join('\n'));
			console.groupEnd();
		} else original(...args);
		logger(formatMessage(...args));
	};
};

forwardConsole('debug', debug);
forwardConsole('info', info);
forwardConsole('warn', warn);
forwardConsole('error', error);
