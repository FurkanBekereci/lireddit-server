// import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from 'type-graphql';
import { User } from './User';
import {
  Entity as TypeOrmEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Updoot } from './Updoot';

//@Entity() // For Mikroorm
@ObjectType()
@TypeOrmEntity() // For Typeorm
export class Post extends BaseEntity {
  /**
   *
   */

  // @PrimaryKey() // For Mikroorm
  @Field(() => Int)
  @PrimaryGeneratedColumn() // For Typeorm
  id!: number;

  // @Property({ type: 'date' }) // For Mikroorm
  @Field(() => String)
  @CreateDateColumn() // For Typeorm
  createdAt: Date;
  //createdAt = new Date(); // For Mikroorm

  // @Property({ type: 'date', onUpdate: () => new Date() }) // For Mikroorm
  @Field(() => String)
  @UpdateDateColumn() // For Typeorm
  updatedAt: Date;
  //updatedAt = new Date(); // For Mikroorm

  // @Property({ type: 'text' }) // For Mikroorm
  @Field()
  @Column({ nullable: false }) // For Typeorm
  title!: string;

  // @Property({ type: 'text' }) // For Mikroorm
  @Field()
  @Column({ nullable: false }) // For Typeorm
  text!: string;

  // @Property({ type: 'text' }) // For Mikroorm
  @Field()
  @Column({ type: 'int', default: 0 }) // For Typeorm
  points!: number;

  @Field(() => Int, { nullable: true })
  voteStatus: number;

  @Field()
  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @Field()
  @Column()
  userId: number;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];
}
