import { SetMetadata } from '@nestjs/common';
import { IPermissionParams } from '../types';

export const PERMISSION_PARAMS_KEY = 'permission_params';

export const PermissionParams = (...params: IPermissionParams[]) =>
  SetMetadata(PERMISSION_PARAMS_KEY, params);
