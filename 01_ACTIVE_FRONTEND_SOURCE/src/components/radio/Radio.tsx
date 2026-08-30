import { z } from 'zod';
import { useEffect, useRef } from 'react';

import { createStore } from '~/server/createStore';
import Preferences from '~/server/stores/preferences';
import Context from '~/server/stores/context';
import Window from '~/server/window';

export const Radio = createStore({
	schema: z.object({
		controls: z
			.object({
				togglePlay: z.function({ input: [], output: z.void() }),
				goLive: z.function({ input: [], output: z.void() }),
				setVolume: z.function({ input: [z.number()], output: z.void() }),
				toggleMute: z.function({ input: [], output: z.void() })
			})
			.optional(),
		playing: z.boolean().default(false),
		live: z.boolean().default(true),
		loading: z.boolean().default(false),
		muted: z.boolean().default(false)
	})
});

export const RadioProvider = () => {
	const ref = useRef<HTMLVideoElement>(null);

	const volume = Preferences.useWatch('radioVolume');

	const region = Preferences.useWatch('account')?.split('@')[1];
	const url =
		region === 'EU'
			? 'https://radio.turtle-music.org'
			: 'https://sgradio.turtle-music.org';

	// Initialize volume
	useEffect(() => {
		const audioElement = ref.current;
		if (!audioElement || audioElement.volume === volume) return;
		audioElement.volume = volume;
	}, [volume]);

	const softReload = Context.useWatch('softReload');

	// Event listeners and controls setup
	useEffect(() => {
		const audioElement = ref.current;
		if (!audioElement) return;

		Window.clearTray();

		// Setup controls
		Radio.update({
			controls: {
				togglePlay: () => {
					if (audioElement.paused) {
						audioElement.play();
					} else {
						audioElement.pause();
					}
					setTimeout(() => Window.updateTray(), 0);
				},
				goLive: () => {
					audioElement.load();
					Radio.update({ live: true });
					if (!audioElement.paused) return;
					audioElement.play();
					setTimeout(() => Window.updateTray(), 0);
				},
				setVolume: v => {
					audioElement.muted = false;
					audioElement.volume = v;
				},
				toggleMute: () => {
					audioElement.muted = !audioElement.muted;
				}
			}
		});

		const eventHandlers = {
			play: () => Radio.update({ playing: true }),
			playing: () => Radio.update({ loading: false }),
			loadeddata: () => Radio.update({ loading: false }),
			stalled: () => Radio.update({ loading: true }),
			waiting: () => Radio.update({ loading: true }),
			pause: () =>
				Radio.update({ playing: false, live: false, loading: false }),
			ended: () => Radio.update({ playing: false, loading: false }),
			volumechange: () => {
				Radio.update({ muted: audioElement.muted });
				Preferences.update({ radioVolume: audioElement.volume });
			}
		};

		// Add event listeners
		Object.entries(eventHandlers).forEach(([event, handler]) => {
			audioElement.addEventListener(event, handler);
		});

		// Cleanup function
		return () => {
			Object.entries(eventHandlers).forEach(([event, handler]) => {
				audioElement.removeEventListener(event, handler);
			});
		};
	}, [ref, softReload]);

	return (
		<audio ref={ref} className="hidden" preload="none">
			<source src={`${url}/stream`} type="audio/mpeg" />
			<track kind="captions" />
		</audio>
	);
};
