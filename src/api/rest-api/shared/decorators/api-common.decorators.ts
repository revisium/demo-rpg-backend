import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ErrorModel } from '../models/error.model';

export const ApiCommonErrors = () =>
  applyDecorators(
    ApiBadRequestResponse({ type: ErrorModel, description: 'Bad request' }),
    ApiUnauthorizedResponse({ type: ErrorModel, description: 'Unauthorized' }),
    ApiForbiddenResponse({ type: ErrorModel, description: 'Forbidden' }),
  );
