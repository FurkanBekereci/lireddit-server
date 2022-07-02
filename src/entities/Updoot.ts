// import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from 'type-graphql';
import { User } from './User';
import { Post } from './Post';
import {
  Entity as TypeOrmEntity,
  BaseEntity,
  ManyToOne,
  PrimaryColumn,
  Column,
} from 'typeorm';

// m to n relationship user with posts

//@Entity() // For Mikroorm
@ObjectType()
@TypeOrmEntity() // For Typeorm
export class Updoot extends BaseEntity {
  @Field(() => Int)
  @Column({ type: 'int' })
  value: number;

  @Field(() => Int)
  @PrimaryColumn({ type: 'int' }) // For Typeorm
  userId!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.updoots) // For Typeorm
  user!: User;

  @Field(() => Int)
  @PrimaryColumn({ type: 'int' }) // For Typeorm
  postId!: number;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.updoots, {
    onDelete: 'CASCADE',
  }) // For Typeorm
  post!: Post;
}
