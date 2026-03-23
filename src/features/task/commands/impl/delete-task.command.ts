export class DeleteTaskCommand {
  constructor(public readonly data: { taskId: string }) {}
}

export type DeleteTaskCommandReturnType = { success: boolean };
