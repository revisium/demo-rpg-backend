import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

const SECRET_BYTE_LENGTH = 36;

@Injectable()
export class OAuthClientService {
  constructor(private readonly prisma: PrismaService) {}

  async registerClient(data: {
    clientName: string;
    redirectUris: string[];
    grantTypes?: string[];
  }) {
    for (const uri of data.redirectUris) {
      if (!this.isValidRedirectUri(uri)) {
        throw new BadRequestException(`Invalid redirect URI: ${uri}`);
      }
    }

    const clientSecret = `ocs_${randomBytes(SECRET_BYTE_LENGTH).toString('hex')}`;
    const clientSecretHash = createHash('sha256').update(clientSecret).digest('hex');

    const client = await this.prisma.oAuthClient.create({
      data: {
        clientName: data.clientName,
        clientSecretHash,
        redirectUris: data.redirectUris,
        grantTypes: data.grantTypes || ['authorization_code', 'refresh_token'],
      },
    });

    return {
      clientId: client.id,
      clientSecret,
      clientName: client.clientName,
      redirectUris: client.redirectUris,
      grantTypes: client.grantTypes,
    };
  }

  async findClient(clientId: string) {
    return this.prisma.oAuthClient.findUnique({ where: { id: clientId } });
  }

  async validateClientSecret(clientId: string, secret: string): Promise<boolean> {
    const client = await this.prisma.oAuthClient.findUnique({ where: { id: clientId } });
    if (!client) return false;

    const hash = createHash('sha256').update(secret).digest('hex');
    const a = Buffer.from(hash);
    const b = Buffer.from(client.clientSecretHash);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private isValidRedirectUri(uri: string): boolean {
    try {
      const url = new URL(uri);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
