import type { DemoRpgDataRegions } from 'src/__generated__/demo-rpg-data';

export class ListRegionsQuery {
  constructor(public readonly data: { first?: number; after?: string }) {}
}

export type ListRegionsQueryReturnType = {
  edges: { cursor: string; node: RegionRow }[];
  totalCount: number;
  pageInfo: { endCursor?: string; hasNextPage: boolean };
};

export type RegionClimate = DemoRpgDataRegions['climate'];
export const REGION_CLIMATES = [
  'temperate',
  'alpine',
  'coastal',
  'desert',
  'forest',
] as const satisfies readonly RegionClimate[];

export type LocalizedString = DemoRpgDataRegions['name'];

export interface RegionRow {
  id: string;
  data: DemoRpgDataRegions;
}
