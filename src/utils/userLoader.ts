import DataLoader from 'dataloader';
import { User } from './../entities/User';

export const userLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdUserMap: Record<number, User> = {};

    users.forEach((user) => {
      userIdUserMap[user.id] = user;
    });

    return userIds.map((userId) => userIdUserMap[userId]);
  });
