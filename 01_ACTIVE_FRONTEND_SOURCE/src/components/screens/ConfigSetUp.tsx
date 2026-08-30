import { FastForward, Info, Sparkles, X } from 'lucide-react';
import { currentMonitor } from '@tauri-apps/api/window';
import { useState } from 'react';

import Dialog from '~/components/styled/Dialog';
import { useTranslation } from '~/components/IntlProvider';
import TextButton from '~/components/styled/TextButton';
import Context from '~/server/stores/context';
import Patcher from '~/server/modules/patcher';
import useAsyncAction from '~/utils/useAsyncAction';
import { Mods } from '~/server/stores/mods';
import useQuery from '~/utils/useQuery';
import { checkDxvk } from '~/server/modules/api';

const presets = {
	performance: {
		spellEffectLevel: 2,
		SpellDetailLevel: 2,
		gxCursor: 0,
		gxMultisampleQuality: 0,
		anisotropic: 16,
		trilinear: 1,
		particleDensity: 0.25,
		unitDrawDist: 200,
		weatherDensity: 0,
		gxFixLag: 0,
		lodDist: 100,
		texLodBias: 1,
		horizonfarclip: 1305,
		textureLodDist: 100,
		gxVSync: 1,
		SmallCull: 2,
		doodadAnim: 0,
		bspcache: 0,
		ffx: 0,
		ffxGlow: 1,
		ffxDeath: 1,
		showfootprints: 0,
		useWeatherShaders: 0,
		showfootprintparticles: 0,
		MaxLights: 2,
		shadowLOD: 0,
		mapShadows: 0,
		frillDensity: 1,
		DistCull: 1,
		M2UsePixelShaders: 0,
		pixelShaders: 0,
		ShadowLOD: 0,
		SkySunGlare: 0,
		detailDoodadAlpha: 0,
		fullAlpha: 0,
		showShadow: 0,
		waterParticulates: 0,
		waterRipples: 0,
		waterSpecular: 0,
		waterWaves: 0,
		shadowLevel: 1
	},
	fidelity: {
		spellEffectLevel: 2,
		gxCursor: 1,
		anisotropic: 16,
		detailDoodadAlpha: 100,
		DistCull: 888,
		EnableErrorSpeech: 0,
		ffxGlow: 1,
		ffxDeath: 1,
		footstepBias: 1.0,
		frillDensity: 48,
		fullAlpha: 1,
		groundEffectDensity: 256,
		groudEffectDistance: 170,
		gxMultisample: 8,
		gxMultisampleQuality: 0.0,
		gxFixLag: 0,
		gxVSync: 1,
		lod: 0,
		lodDist: 400,
		M2UserClipPlanes: 1,
		M2UsePixelShaders: 1,
		M2UserShaders: 1,
		M2UserThreads: 1,
		mapObjLightLOD: 2,
		maxLOD: 3,
		nearClip: 0.33,
		particleDensity: 1.0,
		pixelShaders: 1,
		profanityFilter: 0,
		shadowLevel: 0,
		showSimpleDoodads: 0,
		SkyCloudLOD: 3,
		SkySunGlare: 1,
		SmallCull: 0.01,
		specular: 1,
		texLodBias: -1,
		timingModeOverride: 2,
		targetNearestDistance: 41,
		targetNearestDistanceRadius: 41,
		textureLodDist: 777,
		trilinear: 1,
		unitDrawDist: 300.0,
		waterParticulates: 1,
		waterRipples: 1,
		waterSpecular: 1,
		waterWaves: 1,
		weatherDensity: 0,
		PB_TrashUnitRenderDist: 44,
		PB_TrashUnitRenderDistInCombat: 43,
		PB_CorpseRenderDist: 27,
		SoundMaxHardwareChannels: 64,
		SoundSoftwareChannels: 64,
		UncapSounds: 1,
		useWeatherShaders: 0
	}
};

const ConfigInfo = ({
	preset,
	recommendedMods
}: {
	preset: keyof typeof presets;
	recommendedMods: string[];
}) => {
	const t = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<Dialog
			type="controlled"
			open={open}
			onOpenChange={setOpen}
			title={t({ id: 'config.included_settings' })}
			trigger={
				<TextButton
					icon={Info}
					size={18}
					onClick={undefined as never}
					title={t({ id: 'config.included_settings' })}
					className="inline-flex translate-y-[2px] pt-0"
				/>
			}
			className="!max-h-[50vh] w-full"
		>
			<h4>{t({ id: `config.mods` })}</h4>
			<ul className="p-2">
				{recommendedMods.map(mod => (
					<li key={mod}>{mod}</li>
				))}
			</ul>

			<h4>{t({ id: `config.config_wtf` })}</h4>
			<div className="whitespace-pre p-2 font-mono">
				{Patcher.toWtfFormat(presets[preset])}
			</div>
		</Dialog>
	);
};

const ConfigSetUp = () => {
	const t = useTranslation();

	const a = useAsyncAction();

	const dxvkSupported = useQuery({ args: [], query: checkDxvk });

	const recommendedMods = [
		'VfPatcher.dll',
		dxvkSupported.data === 'recommended' ? 'dxvk' : undefined
	].filter(v => v !== undefined);

	const apply = async (preset?: keyof typeof presets) => {
		const config: Record<string, unknown> = preset ? presets[preset] : {};

		// Enable recommended mods
		if (preset) {
			for (const mod of recommendedMods) await Mods.addCustomDLL(mod);
			console.info('[CONFIG] Enabled recommended DLLs');
		}

		// Auto detect resolution
		const monitor = await currentMonitor().catch(() => null);
		config.gxResolution = monitor?.size
			? `${monitor?.size.width}x${monitor?.size.height}`
			: undefined;

		// Set the turtleWoW config
		config.turtleWoW = preset ?? 'none';

		await Patcher.patchConfig(undefined, config);
		console.info(`[CONFIG] Applied preset ${preset ?? 'none'}`);

		Context.softReload();
	};

	return (
		<Dialog type="nonModal" title={t({ id: 'config.title' })}>
			<div className="grid grid-cols-[auto_1fr] items-center gap-3">
				<p className="col-span-2">{t({ id: 'config.description' })}</p>

				<TextButton
					icon={X}
					onClick={a.action(() => apply())}
					disabled={a.loading}
				>
					{t({ id: 'config.no_preset' })}
				</TextButton>
				<p className="text-blueGray">
					{t({ id: 'config.no_preset_description' })}
				</p>

				<TextButton
					icon={FastForward}
					onClick={a.action(() => apply('performance'))}
					disabled={a.loading}
					className="text-warmGreen"
				>
					{t({ id: 'config.performance_preset' })}
				</TextButton>
				<p className="text-blueGray">
					{t({ id: 'config.performance_preset_description' })}
					<ConfigInfo preset="performance" recommendedMods={recommendedMods} />
				</p>

				<TextButton
					icon={Sparkles}
					onClick={a.action(() => apply('fidelity'))}
					disabled={a.loading}
					className="text-pink"
				>
					{t({ id: 'config.fidelity_preset' })}
				</TextButton>
				<p className="text-blueGray">
					{t({ id: 'config.fidelity_preset_description' })}
					<ConfigInfo preset="fidelity" recommendedMods={recommendedMods} />
				</p>
			</div>
		</Dialog>
	);
};

export default ConfigSetUp;
