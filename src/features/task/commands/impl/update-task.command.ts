export class UpdateTaskCommand {
  constructor(
    public readonly data: {
      taskId: string;
      title?: string;
      description?: string;
      status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    },
  ) {}
}

export type UpdateTaskCommandReturnType = { id: string };
