import { Module } from '@nestjs/common';
import { TodoModule } from './todo/todo.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TodoModule, DatabaseModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
