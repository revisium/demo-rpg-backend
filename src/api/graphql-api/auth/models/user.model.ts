import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  username!: string;

  @Field()
  roleId!: string;
}
