import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DictionaryModule } from 'src/features/dictionary/dictionary.module';
import { RegionsApiService } from './regions-api.service';
import { REGIONS_QUERIES } from './queries/handlers';

@Module({
  imports: [CqrsModule, DictionaryModule],
  providers: [RegionsApiService, ...REGIONS_QUERIES],
  exports: [RegionsApiService],
})
export class RegionsModule {}
