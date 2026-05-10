import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DictionaryApiService } from './dictionary-api.service';

@Module({
  imports: [ConfigModule, CqrsModule],
  providers: [DictionaryApiService],
  exports: [DictionaryApiService],
})
export class DictionaryModule {}
