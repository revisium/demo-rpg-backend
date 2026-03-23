import { Injectable } from '@nestjs/common';
import { DictionaryProxyService } from './dictionary-proxy.service';

@Injectable()
export class DictionaryApiService {
  constructor(private readonly proxy: DictionaryProxyService) {}

  async getRows(tableId: string, revisionId: string) {
    return this.proxy.getRows(tableId, revisionId);
  }

  async getRow(tableId: string, rowId: string, revisionId: string) {
    return this.proxy.getRow(tableId, rowId, revisionId);
  }
}
