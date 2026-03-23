export class TaskCreatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
  ) {}
}
