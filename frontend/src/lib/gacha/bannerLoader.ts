import { beginner } from '@/data/banners/beginner.json';
import { standard } from '@/data/banners/standard.json';
import { allPatch, wishPhase } from '@/data/wish-setup.json';
import { rollCounter } from './storage';
import type { BannerItem } from '@/stores/bannerStore';

// Port of lib/helpers/banner-loader.js from the reference (Mantan21,
// MIT). Custom-banner path (local/custom versions) is out of scope.

const checkBeginnerBanner = () => rollCounter.get('beginner') < 20;

const withName = <T extends { type: string }>(item: T): T & { name: string } => ({ ...item, name: item.type });

export const getAvailablePhases = async (patch: string): Promise<number[]> => {
  const { data } = await import(`@/data/banners/events/${patch}.json`);
  return data.map((d: { phase: number }) => d.phase);
};

/** All selectable versions (patch + its phases), newest first. */
export const getVersionList = async (): Promise<Array<{ patch: string; phase: number }>> => {
  const list: Array<{ patch: string; phase: number }> = [];
  for (const patch of [...allPatch].reverse()) {
    const phases = await getAvailablePhases(String(patch));
    for (const phase of phases) list.push({ patch: String(patch), phase });
  }
  return list;
};

export const initializeBanner = async ({ patch, phase }: { patch: string; phase: number }): Promise<BannerItem[]> => {
  if (!patch || !phase) return [];
  if (patch.match(/(local|custom)/gi)) return [];

  const list: BannerItem[] = checkBeginnerBanner() ? [withName({ type: 'beginner', ...beginner.featured })] : [];

  const { data } = await import(`@/data/banners/events/${patch}.json`);
  const { banners } = data.find((b: { phase: number }) => b.phase === phase) ?? { banners: null };
  if (!banners) return list;

  const { events, weapons, standardVersion: stdver, chronicled = null } = banners;
  const { featured: stdFeatured } = standard.find(({ version }) => stdver === version) ?? { featured: undefined };

  const charEventBanner = { type: 'character-event' as const, rateup: events.rateup, stdver };
  events.featured.forEach((eventdata: { bannerName: string; character: string; textOffset?: Record<string, number> }) =>
    list.push(withName({ ...eventdata, ...charEventBanner }))
  );
  list.push(withName({ type: 'weapon-event', stdver, ...weapons }));
  if (chronicled) list.push(withName({ type: 'chronicled', stdver, ...chronicled }));
  if (stdFeatured) list.push(withName({ type: 'standard', stdver, ...stdFeatured }));

  return list;
};

/** Initial version to load when nothing is stored yet. */
export const defaultVersion = () => ({ patch: String(allPatch[allPatch.length - 1]), phase: wishPhase });
