export class ListRegionsQuery {
  constructor(public readonly data: { first?: number; after?: string }) {}
}

export type ListRegionsQueryReturnType = {
  edges: { cursor: string; node: RegionRow }[];
  totalCount: number;
  pageInfo: { endCursor?: string; hasNextPage: boolean };
};

export const REGION_CLIMATES = ['temperate', 'alpine', 'coastal', 'desert', 'forest'] as const;
export type RegionClimate = (typeof REGION_CLIMATES)[number];

export interface LocalizedString {
  en: string;
  ru: string;
  zh: string;
}

export interface RegionRow {
  id: string;
  data: {
    name: LocalizedString;
    description: LocalizedString;
    climate: RegionClimate;
  };
}
