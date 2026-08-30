import { RotateCcw } from 'lucide-react';
import cls from 'classnames';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { useMemo, useState } from 'react';

import { FormattedBeMessage, useTranslation } from '~/components/IntlProvider';
import { fetchLauncherManifest, fetchMirrors } from '~/server/modules/api';
import useQuery from '~/utils/useQuery';
import Context from '~/server/stores/context';
import { type LocalizedMessage } from '~/utils';

import Radio from '../form/Radio';
import TextButton from '../styled/TextButton';
import IconSpinner from '../styled/IconSpinner';
import FetchCache from '~/server/stores/fetchCache';

type Props = {
	value: string;
	onChange: (value: string) => void;
	error?: LocalizedMessage;
	setError: (message?: LocalizedMessage) => void;
};

const PROBE_BYTES = 256 * 1024;
const THROUGHPUT_SAMPLES = 3;
const WORST_COLOR = [238, 51, 51];
const BEST_COLOR = [197, 203, 99];

const withCacheBust = (url: string) => {
	const u = new URL(url);
	u.searchParams.set('_probe', String(Date.now()));
	return u.toString();
};

const median = (values: number[]) => {
	if (!values.length) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
};

const interpolateChannel = (start: number, end: number, ratio: number) =>
	Math.round(start + (end - start) * ratio);

const getProbeColor = (probe: number, minProbe: number, maxProbe: number) => {
	const ratio = Math.max(
		0,
		Math.min(1, (probe - minProbe) / (maxProbe - minProbe))
	);
	return `rgb(${[0, 1, 2]
		.map(i => interpolateChannel(WORST_COLOR[i], BEST_COLOR[i], ratio))
		.join(',')})`;
};

const probeMirror = async (
	url: string,
	revalidate?: boolean,
	signal?: AbortSignal
) =>
	FetchCache.get({
		key: `mirror-probe:${url.match(/^https?:\/\/([^/]+)/)?.[1] ?? url}`,
		ttl: 60 * 60,
		revalidate,
		callback: async () => {
			const throughputSamples: number[] = [];
			for (let i = 0; i < THROUGHPUT_SAMPLES; i++) {
				const start = performance.now();
				try {
					const response = await tauriFetch(withCacheBust(url), {
						method: 'GET',
						headers: { Range: `bytes=0-${PROBE_BYTES - 1}` },
						signal
					});

					if (!response.ok) continue;

					const body = await response.arrayBuffer();
					const elapsed = Math.max((performance.now() - start) / 1000, 0.001);
					const mbps = (body.byteLength * 8) / elapsed / 1_000_000;
					throughputSamples.push(mbps);
				} catch {
					throughputSamples.push(0);
				}
			}
			return median(throughputSamples);
		}
	});

const MirrorSelect = ({ value, onChange, error, setError }: Props) => {
	const t = useTranslation();

	const offline = Context.useWatch('offline');
	const [probeByMirror, setProbeByMirror] = useState<Record<string, number>>();

	const mirrors = useQuery({
		args: [offline, undefined as boolean | undefined],
		query: async (offline, revalidate, ctx) => {
			setError(undefined);
			if (offline) return [];

			const [r, launcherManifest] = await Promise.all([
				fetchMirrors(revalidate),
				fetchLauncherManifest(revalidate)
			]);

			if (!r.ok) {
				setError(r.error);
				return [];
			}

			if (!r.data.find(d => d.key === value)) {
				onChange(r.data[0].key);
			}

			const ping = async () => {
				const mirrors = launcherManifest?.mirrors;
				if (!mirrors) return;
				setProbeByMirror(undefined);
				await Promise.all(
					r.data.map(async row =>
						probeMirror(mirrors[row.key], revalidate, ctx.signal)
							.then(probe => {
								setProbeByMirror(prev => ({
									...prev,
									[row.key]: probe
								}));
							})
							.catch(() => {
								setProbeByMirror(prev => ({
									...prev,
									[row.key]: 0
								}));
							})
					)
				);
			};
			ping();

			return r.data;
		}
	});

	const options = useMemo(() => {
		const validProbes = Object.values(probeByMirror ?? {}).filter(p => p > 0);
		const minProbe = Math.min(...validProbes);
		const maxProbe = Math.max(...validProbes);

		return (mirrors.data ?? []).map(({ key, name }) => {
			const probe = probeByMirror?.[key];
			return {
				key: name,
				value: key,
				label: (
					<span className="flex cursor-[inherit] items-center gap-1 text-inherit">
						{name}
						{probe === undefined ? (
							<IconSpinner className="w-3" />
						) : (
							<span
								className={cls(
									'-scale-25 -ml-1 mr-[-10px] cursor-[inherit] text-xs'
								)}
								style={{ color: getProbeColor(probe, minProbe, maxProbe) }}
							>
								{!probe ? 'n/a' : `${probe.toFixed(1)}Mb/s`}
							</span>
						)}
					</span>
				)
			};
		});
	}, [mirrors.data, probeByMirror]);

	return (
		<div>
			<div className="flex gap-2">
				<h4>{t({ id: 'general.download_mirror' })}</h4>
				<TextButton
					icon={RotateCcw}
					title={t({ id: 'general.reset' })}
					onClick={async () => await mirrors.refetch([offline, true])}
					loading={mirrors.loading}
					disabled={!!offline}
					size={16}
					className="-m-2 text-blueGray"
				/>
			</div>
			<Radio
				value={value}
				setValue={onChange}
				options={options}
				disabled={mirrors.loading || !!offline}
				error={!!error}
			/>
			{error ? (
				<div className="grow text-red">
					<FormattedBeMessage message={error} />
				</div>
			) : (
				<p className="text-sm text-blueGray">
					{t({ id: 'general.download_mirror_info' })}
				</p>
			)}
		</div>
	);
};

export default MirrorSelect;
