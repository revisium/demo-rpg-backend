import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import { HttpAuthGuard } from 'src/features/auth/guards/http-auth.guard';
import { HttpPermissionGuard } from 'src/features/auth/guards/http-permission.guard';
import { PermissionParams } from 'src/features/auth/decorators/permission-params.decorator';
import { PermissionAction, PermissionSubject } from 'src/features/auth/types';
import { RegionClimate } from 'src/features/regions/queries/impl/list-regions.query';
import { ListRegionsDto } from './dto/list-regions.dto';
import { RegionResponseModel, RegionsListResponseModel } from './models/region-response.model';

@ApiTags('regions')
@UseGuards(HttpAuthGuard, HttpPermissionGuard)
@PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Region })
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsApi: RegionsApiService) {}

  @Get()
  @ApiOperation({ summary: 'List Eldoria regions from demo-rpg-data' })
  @ApiResponse({ status: 200, type: RegionsListResponseModel })
  async list(@Query() data: ListRegionsDto): Promise<RegionsListResponseModel> {
    const result = await this.regionsApi.listRegions({
      first: data.first,
      skip: data.skip,
    });
    return {
      edges: result.edges.map((edge) => toRegion(edge.node.id, edge.node.data)),
      totalCount: result.totalCount,
    };
  }

  @Get(':regionId')
  @ApiOperation({ summary: 'Get a single Eldoria region' })
  @ApiResponse({ status: 200, type: RegionResponseModel })
  @ApiResponse({ status: 404, description: 'Region not found' })
  async get(@Param('regionId') regionId: string): Promise<RegionResponseModel> {
    const row = await this.regionsApi.getRegion({ regionId });
    if (!row) {
      throw new NotFoundException(`Region "${regionId}" not found`);
    }
    return toRegion(row.id, row.data);
  }
}

function toRegion(
  id: string,
  data: {
    name: { en: string; ru: string; zh: string };
    description: { en: string; ru: string; zh: string };
    climate: RegionClimate;
  },
): RegionResponseModel {
  return {
    id,
    name: data.name,
    description: data.description,
    climate: data.climate,
  };
}
