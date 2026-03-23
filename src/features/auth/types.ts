export interface IAuthUser {
  userId: string;
  email: string;
  username: string;
  roleId: string;
}

export interface IPermissionParams {
  action: string;
  subject: string;
}

export enum PermissionAction {
  manage = 'manage',
  read = 'read',
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export enum PermissionSubject {
  all = 'all',
  Task = 'Task',
  User = 'User',
}
