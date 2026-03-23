export class GetTaskQuery {
  constructor(public readonly data: { taskId: string }) {}
}

export type GetTaskQueryReturnType = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
