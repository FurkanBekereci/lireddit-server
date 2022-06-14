// import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from 'type-graphql';
import { OneToMany } from 'typeorm';
import { Post } from './Post';
import {
  Entity as TypeOrmEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';
import { Updoot } from './Updoot';

// @Entity() // For Mikroorm
@ObjectType()
@TypeOrmEntity() // For Typeorm
export class User extends BaseEntity {
  /**
   *
   */

  // @PrimaryKey() // For MikroOrm
  @Field(() => Int)
  @PrimaryGeneratedColumn() // For Typeorm
  id!: number;

  // @Property({ type: 'date' }) // For MikroOrm
  @Field(() => String)
  @CreateDateColumn() // For Typeorm
  createdAt: Date;
  //createdAt = new Date(); // For MikroOrm

  // @Property({ type: 'date', onUpdate: () => new Date() }) // For MikroOrm
  @Field(() => String)
  @UpdateDateColumn() // For Typeorm
  updatedAt: Date;
  //updatedAt = new Date();

  // @Property({ type: 'text', unique: true }) // For MikroOrm
  @Field()
  @Column({ unique: true }) // For Typeorm
  username!: string;

  // @Property({ type: 'text', unique: true }) // For MikroOrm
  @Field()
  @Column({ unique: true }) // For Typeorm
  email!: string;

  // @Property({ type: 'text' }) // For MikroOrm
  @Column() // For Typeorm
  password!: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[];
}
