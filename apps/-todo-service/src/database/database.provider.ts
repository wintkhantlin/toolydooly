import { Provider } from '@nestjs/common';
import * as mongoose from 'mongoose';

let connection: typeof mongoose | null = null;

export const databaseProviders: Provider[] = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> => {
      if (!connection) {
        connection = await mongoose.connect(process.env.TODO_DATABASE_URL as string, {
          maxPoolSize: 10,
        });
      }
      return connection;
    },
  },
];
