export class ListRegionsQuery {
  constructor(public readonly data: { first?: number; skip?: number }) {}
}

export type ListRegionsQueryReturnType = {
  edges: { node: RegionRow }[];
  totalCount: number;
};

export const REGION_CLIMATES = ['temperate', 'alpine', 'coastal', 'desert', 'forest'] as const;
export type RegionClimate = (typeof REGION_CLIMATES)[number];

export interface RegionRow {
  id: string;
  data: {
    name: { en: string; ru: string; zh: string };
    description: { en: string; ru: string; zh: string };
    climate: RegionClimate;
  };
}
