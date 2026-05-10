import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function initSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('demo-rpg-backend')
    .setDescription('Branching Tales subgraph: NestJS REST API for the demo-rpg federated graph')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('regions', 'Eldoria regions from demo-rpg-data')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
      filter: true,
    },
  });
}
