import DataLoader from 'dataloader';
import { Updoot } from './../entities/Updoot';

export const updootLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any[]);
      const keysToUpdoot: Record<string, Updoot> = {};

      updoots.forEach((updoot) => {
        keysToUpdoot[`${updoot.userId}-${updoot.postId}`] = updoot;
      });

      return keys.map((key) => keysToUpdoot[`${key.userId}-${key.postId}`]);
    }
  );
