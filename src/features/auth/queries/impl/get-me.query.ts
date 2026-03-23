export class GetMeQuery {
  constructor(public readonly data: { userId: string }) {}
}

export type GetMeQueryReturnType = {
  id: string;
  email: string;
  username: string;
  roleId: string;
};
