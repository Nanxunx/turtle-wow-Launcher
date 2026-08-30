import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { app } from '@tauri-apps/api';

import '~/server/setup';
import './index.css';

import Layout from './layout/Layout';
import App from './App';

const boxLogMessage = (prefix: string, message: string) => {
	const lines = message.split('\n');
	const maxLength = Math.max(...lines.map(line => line.length));
	const border = '─'.repeat(maxLength + 4);
	const formattedLines = lines.map(line => `│ ${line.padEnd(maxLength)} │`);
	return `${prefix}\n${border}\n${formattedLines.join('\n')}\n${border}`;
};

app.getVersion().then(version => {
	console.info(boxLogMessage('[SETUP] ', `Launcher v${version}`));
	console.debug('[SETUP] Debug logging enabled');
	createRoot(document.getElementById('root') as HTMLElement).render(
		<StrictMode>
			{import.meta.env.MODE === 'development' && <script async crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />}
			<Layout version={version}><App /></Layout>
		</StrictMode>
	);
});
