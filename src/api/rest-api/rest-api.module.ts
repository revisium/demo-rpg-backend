import { Module } from '@nestjs/common';
import { AuthModule } from 'src/features/auth/auth.module';
import { RegionsModule } from 'src/features/regions/regions.module';
import { RegionsController } from './regions/regions.controller';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [AuthModule, RegionsModule],
  controllers: [RegionsController, AuthController],
})
export class RestApiModule {}
