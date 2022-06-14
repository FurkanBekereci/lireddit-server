import {
  Arg,
  Ctx,
  Field,
  Mutation,
  Resolver,
  ObjectType,
  Query,
  registerEnumType,
  FieldResolver,
  Root,
} from 'type-graphql';
import { MyContext } from './../types';
import { User } from './../entities/User';
import argon2 from 'argon2';
import { COOKIE_NAME } from '../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from './../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';
import { FORGOT_PASSWORD_PREFIX } from './../constants';
import { getConnection } from 'typeorm';

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

enum LoginType {
  USERNAME = 'username',
  EMAIL = 'email',
}

registerEnumType(LoginType, {
  name: 'LoginType',
  description: 'The ways of login',
});

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    //This condition specifies that user can see their own email
    if (req.session?.userId === user.id) return user.email;

    //current user attempts to see someone else's email
    return '';
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session?.userId) {
      return null;
    }

    return User.findOneBy({ id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('registerData') registerData: UsernamePasswordInput
    // @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(registerData);

    if (errors.length > 0) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(registerData.password);
    let user;
    try {
      // This usage is equivalence of below usage
      // const result = await User.create({
      //   username: registerData.username,
      //   email: registerData.email,
      //   password: hashedPassword,
      // }).save();

      //This usage is query builder techniques
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: registerData.username,
          email: registerData.email,
          password: hashedPassword,
        })
        .returning('*')
        .execute();
      user = result.raw[0];
    } catch (err) {
      //Duplicate username error
      if (err?.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'this username already taken.',
            },
          ],
        };
      }

      throw new Error('Something went wrong!!');
    }
    // req.session!.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('loginData') loginData: UsernamePasswordInput,
    @Arg('loginType', () => LoginType) loginType: LoginType,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    console.log('login type : ', loginType);

    //User filter by login type
    const searcher =
      loginType == LoginType.EMAIL
        ? { email: loginData.email }
        : { username: loginData.username };

    const user = await User.findOneBy(searcher);

    // console.log('user , ', user);

    if (!user) {
      return {
        errors: [
          {
            field: loginType,
            message: `${loginType} does not exist`,
          },
        ],
      };
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      loginData.password
    );

    if (!isPasswordValid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    // console.log('userid : ', user.id);

    req.session!.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session?.destroy((err: any) => {
        if (err) {
          console.log('destroy session error: ', err);

          resolve(false);
          return;
        }

        console.log('Cookie is clearing...');

        res.clearCookie(COOKIE_NAME);
        resolve(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { req, res, redis }: MyContext
  ) {
    const user = await User.findOneBy({ email });

    if (!user) {
      console.log('user not found!!');

      return false;
    }

    const resetToken = v4();
    await redis.set(
      `${FORGOT_PASSWORD_PREFIX}${resetToken}`,
      user.id,
      'EX',
      1000 * 60 * 60
    ); // 1 hour

    const resetPasswordLink = `<a href="http://localhost:3000/auth/reset-password/${resetToken}">reset password</a>`;
    await sendEmail(email, resetPasswordLink);

    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis }: MyContext
  ) {
    if (newPassword?.length <= 2) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be greater than 2',
          },
        ],
      };
    }

    const key = `${FORGOT_PASSWORD_PREFIX}${token}`;

    const userId = await redis.get(key);

    if (!userId) {
      console.log('token not valid');

      return false;
    }

    const userIdNum = Number(userId);
    const user = await User.findOneBy({ id: userIdNum });

    if (!user) {
      console.log('user not found');

      return true;
    }

    // user!.password = await argon2.hash(newPassword);
    // await em.persistAndFlush(user);

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);
    return true;
  }
}
