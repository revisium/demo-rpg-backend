export interface McpUserContext {
  userId: string;
  username: string;
  email: string;
  roleId: string;
}

export interface McpPermissionCheck {
  action: string;
  subject: string;
}

export interface McpAuthHelpers extends McpUserContext {
  checkSystemPermission: (permissions: McpPermissionCheck[]) => Promise<void>;
}

export interface McpToolRegistrar {
  register(server: any, auth: McpAuthHelpers): void;
}
