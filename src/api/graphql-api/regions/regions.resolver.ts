import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import { GqlAuthGuard } from 'src/features/auth/guards/gql-auth.guard';
import { GqlPermissionGuard } from 'src/features/auth/guards/gql-permission.guard';
import { PermissionParams } from 'src/features/auth/decorators/permission-params.decorator';
import { PermissionAction, PermissionSubject } from 'src/features/auth/types';
import { RegionClimate } from 'src/features/regions/queries/impl/list-regions.query';
import { RegionModel } from './models/region.model';
import { RegionsListModel } from './models/regions-list.model';
import { ListRegionsInput } from './inputs/list-regions.input';

@UseGuards(GqlAuthGuard, GqlPermissionGuard)
@PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Region })
@Resolver(() => RegionModel)
export class RegionsResolver {
  constructor(private readonly regionsApi: RegionsApiService) {}

  @Query(() => RegionsListModel)
  async regions(
    @Args('data', { nullable: true }) data?: ListRegionsInput,
  ): Promise<RegionsListModel> {
    const result = await this.regionsApi.listRegions({
      first: data?.first,
      skip: data?.skip,
    });
    return {
      edges: result.edges.map((edge) => toRegionModel(edge.node.id, edge.node.data)),
      totalCount: result.totalCount,
    };
  }

  @Query(() => RegionModel, { nullable: true })
  async region(@Args('regionId') regionId: string): Promise<RegionModel | null> {
    const row = await this.regionsApi.getRegion({ regionId });
    return row ? toRegionModel(row.id, row.data) : null;
  }
}

function toRegionModel(
  id: string,
  data: {
    name: { en: string; ru: string; zh: string };
    description: { en: string; ru: string; zh: string };
    climate: RegionClimate;
  },
): RegionModel {
  return {
    id,
    name: data.name,
    description: data.description,
    climate: data.climate,
  };
}
