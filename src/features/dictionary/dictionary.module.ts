import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DictionaryProxyService } from './dictionary-proxy.service';
import { DictionaryApiService } from './dictionary-api.service';

@Module({
  imports: [ConfigModule, CqrsModule],
  providers: [DictionaryProxyService, DictionaryApiService],
  exports: [DictionaryApiService],
})
export class DictionaryModule {}
