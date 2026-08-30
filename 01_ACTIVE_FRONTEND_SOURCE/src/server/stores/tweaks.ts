import { z } from 'zod';

import { createStore } from '../createStore';

export const TweaksSchema = z.object({
	nameplateRange: z.number().default(41),
	alwaysAutoLoot: z.boolean().default(false),
	fieldOfView: z.number().default(110),
	farClip: z.number().default(777),
	frillDistance: z.number().default(70),
	cameraDistance: z.number().default(50),
	soundInBackground: z.boolean().default(true)
});
export type TweaksSchema = z.infer<typeof TweaksSchema>;

const Tweaks = createStore({ schema: TweaksSchema, file: 'tweaks.json' });

export default Tweaks;
