import { RegionRow } from './list-regions.query';

export class GetRegionQuery {
  constructor(public readonly data: { regionId: string }) {}
}

export type GetRegionQueryReturnType = RegionRow | null;
