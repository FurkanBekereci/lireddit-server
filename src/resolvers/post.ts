// import { MyContext } from 'src/types';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { Post } from './../entities/Post';
import { isAuth } from './../middleware/isAuth';
import { getConnection, getManager } from 'typeorm';
import { ObjectType } from 'type-graphql';
import { Updoot } from './../entities/Updoot';
import { userLoader } from './../utils/userLoader';

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post!])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  //Fieldresolver is about derived data and does not exist in db
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text?.slice(0, 50);
  }

  @FieldResolver(() => String)
  user(@Root() root: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(root.userId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() root: Post,
    @Ctx() { req, updootLoader }: MyContext
  ) {
    const { userId } = req.session;
    // console.log(
    //   'updootLoader:',
    //   updootLoader.load({ postId: root.id, userId: Number(userId) })
    // );
    // // console.log('req:', req.session);
    // console.log('userId:', userId);

    // console.log(
    //   'updoots:',
    //   root.updoots.find((u) => u.userId == Number(userId))
    // );

    const updoot = await updootLoader.load({
      postId: root.id,
      userId: Number(userId),
    });

    // return userId
    //   ? root.updoots?.find((updoot) => updoot.userId == userId)?.value
    //   : null;

    return updoot?.value;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;

    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    //daha önce gönderiyi oylamışsa
    //ve oyunu değiştirmek istediyse
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tem) => {
        await tem.query(
          `
        
          update updoot 
          set value = $1
          where "postId" = $2 and "userId" = $3

        `,
          [realValue, postId, userId]
        );

        await tem.query(
          `
        
          update post 
          set points = points + $1
          where id =$2

        `,
          [2 * realValue, postId]
        );
      });
    }
    // hiç oylamamışsa
    else if (!updoot) {
      await getConnection().transaction(async (tem) => {
        await tem.query(
          `
        
          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3)

        `,
          [userId, postId, realValue]
        );

        await tem.query(
          `
        
          update post 
          set points = points + $1
          where id = $2

        `,
          [realValue, postId]
        );
      });
    }
    // else {
    //   console.log('3');
    //   await getConnection().query(`

    //   START TRANSACTION;

    //   insert into updoot ("userId", "postId", value)
    //   values(${userId}, ${postId}, ${realValue});

    //   update post
    //   set points = points + ${realValue}
    //   where id = ${postId};

    //   COMMIT;
    // `);
    // }

    // TODO: Sonra denemelisin
    // await getConnection().transaction(async (transactionalEM) => {
    //   await transactionalEM.insert(Updoot, {
    //     userId,
    //     postId,
    //     value: realValue,
    //   });

    //   await transactionalEM.update(Post, { id: postId }, { points: value });
    // });

    return true;
  }

  @Query(() => PaginatedPosts)
  async getPosts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    //#region "Query way"

    // const replacements: any[] = [realLimitPlusOne];

    // if (cursor) {
    //   replacements.push(new Date(parseInt(cursor)));
    // }

    // const postData = (await getConnection().query(
    //   `

    //   select
    //   p.*,
    //   json_build_object(
    //     'id', u.id,
    //     'username', u.username,
    //     'email', u.email
    //   ) "user"
    //   from post p
    //   inner join public.user u on u.id = p."userId"
    //   ${cursor ? ' where p."createdAt" < $2' : ''}
    //   order by p."createdAt" DESC
    //   limit $1
    // `,
    //   replacements
    // )) as Post[];

    // console.log('post data with query: ', postData);

    //#endregion

    //#region This is query builder way
    const qb = await getConnection()
      .getRepository(Post)
      .createQueryBuilder('p')
      // .leftJoinAndSelect('p.user', 'u')
      // .leftJoinAndSelect('p.updoots', 'up')
      .orderBy('p."createdAt"', 'DESC')
      .limit(realLimitPlusOne);

    if (cursor) {
      qb.where('p."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    // return Post.find();
    const posts = await qb.getMany();
    //console.log('posts: ', posts);

    //#endregion

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  getPostById(
    @Arg('id', () => Int) id: number
    // @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    // return em.findOne(Post, { id });
    return Post.findOne({ where: { id }, relations: ['user', 'updoots'] });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async addPost(
    @Arg('postData') postData: PostInput,
    @Ctx() { req }: MyContext //For Mikro orm
  ): Promise<Post> {
    //#region "For Mikro orm"
    // const post = em.create(Post, new Post(title));
    // await em.persistAndFlush(post);
    // return post
    //#endregion

    // if (!req.session.userId) {
    //   throw new Error('not authenticated');
    // }

    return Post.create({
      ...postData,
      userId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
    @Arg('text', () => String, { nullable: true }) text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    //#region "For Mikro Orm"
    // const post = await em.findOne(Post, { id });

    // if (!post) {
    //   throw new Error('Id not found');
    // }

    // if (typeof title !== 'undefined') {
    //   post.title = title;
    //   await em.persistAndFlush(post);
    // }

    // return post;
    //#endregion

    // //TODO: control if the post is refreshed?
    const post = await Post.findOneBy({ id });

    if (!post) {
      throw new Error('Id not found');
    }

    if (typeof title !== 'undefined') {
      // const data = await Post.update(
      //   { id, userId: req.session.userId },
      //   { title, text }
      // );
      const data = await Post.createQueryBuilder()
        .update()
        .set({ title, text })
        .where('id = :id and "userId" = :userId', {
          id,
          userId: req.session.userId,
        })
        .returning('*')
        .execute();

      console.log('returnin result = ', data.raw[0]);
      return data.raw[0] as Post;
    }

    // const post = await Post
    //   .createQueryBuilder()
    //   .update()
    //   .set({title, text})
    //   .where('id = :id and "userId" = :userId',{
    //     id,
    //     userId: req.session.userId
    //   })
    //   .returning('*')
    //   .execute();

    throw new Error('Update returned fail.');
  }
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    //#region "For Mikro Orm"
    // try {
    //   const num = await em.nativeDelete(Post, { id });
    //   // This num is number of row effected
    //   // console.log('num : ', num);

    //   return num > 0;
    // } catch (error) {
    //   return false;
    // }
    //#endregion

    //#region "Not cascading"

    // try {
    //   const post = await Post.findOneBy({ id });
    //   //This deleted by unknown reason without from client
    //   if (!post) return false;

    //   if (post.userId != req.session.userId) throw new Error('not authorized');

    //   await Updoot.delete({ postId: id });
    //   const result = await Post.delete({ id, userId: req.session.userId });

    //   return !!result?.affected;
    // } catch (error) {
    //   console.log(error);

    //   return false;
    // }
    //#endregion

    //#region "Cascading way"
    // Add cascade info to many to one relations in entity file.
    try {
      const result = await Post.delete({ id, userId: req.session.userId });

      return !!result?.affected;
    } catch (error) {
      console.log(error);

      return false;
    }

    //#endregion
  }
}
