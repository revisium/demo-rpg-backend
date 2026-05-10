import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import { HttpAuthGuard } from 'src/features/auth/guards/http-auth.guard';
import { HttpPermissionGuard } from 'src/features/auth/guards/http-permission.guard';
import { PermissionParams } from 'src/features/auth/decorators/permission-params.decorator';
import { PermissionAction, PermissionSubject } from 'src/features/auth/types';
import {
  LocalizedString,
  RegionClimate,
} from 'src/features/regions/queries/impl/list-regions.query';
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
  @ApiResponse({ status: HttpStatus.OK, type: RegionsListResponseModel })
  async list(@Query() data: ListRegionsDto): Promise<RegionsListResponseModel> {
    const result = await this.regionsApi.listRegions({
      first: data.first,
      after: data.after,
    });
    return {
      edges: result.edges.map((edge) => ({
        cursor: edge.cursor,
        node: toRegion(edge.node.id, edge.node.data),
      })),
      totalCount: result.totalCount,
      pageInfo: {
        endCursor: result.pageInfo.endCursor,
        hasNextPage: result.pageInfo.hasNextPage,
      },
    };
  }

  @Get(':regionId')
  @ApiOperation({ summary: 'Get a single Eldoria region' })
  @ApiResponse({ status: HttpStatus.OK, type: RegionResponseModel })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Region not found' })
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
    name: LocalizedString;
    description: LocalizedString;
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
