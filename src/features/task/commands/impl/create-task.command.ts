export class CreateTaskCommand {
  constructor(
    public readonly data: {
      title: string;
      description?: string;
      userId: string;
    },
  ) {}
}

export type CreateTaskCommandReturnType = { id: string };
