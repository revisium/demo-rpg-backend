export class GetTasksQuery {
  constructor(
    public readonly data: {
      userId?: string;
      status?: string;
      first?: number;
      skip?: number;
    },
  ) {}
}

export type GetTasksQueryReturnType = {
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  totalCount: number;
};
