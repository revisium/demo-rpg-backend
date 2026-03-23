export class SignUpCommand {
  constructor(
    public readonly data: {
      email: string;
      username: string;
      password: string;
    },
  ) {}
}

export type SignUpCommandReturnType = { id: string };
