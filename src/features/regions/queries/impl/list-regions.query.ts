export class ListRegionsQuery {
  constructor(public readonly data: { first?: number; skip?: number }) {}
}

export type ListRegionsQueryReturnType = {
  edges: { node: RegionRow }[];
  totalCount: number;
};

export interface RegionRow {
  id: string;
  data: {
    name: { en: string; ru: string; zh: string };
    description: { en: string; ru: string; zh: string };
    climate: 'temperate' | 'alpine' | 'coastal' | 'desert' | 'forest';
  };
}
