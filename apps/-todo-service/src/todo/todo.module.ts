import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { todoProviders } from './todo.provider';
import { DatabaseModule } from 'src/database/database.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [DatabaseModule, ClientsModule.register({
    clients: [
      {
        name: "RABBIT_MQ",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.QUEUE_URL as string],
          queue: "app_queue",
          queueOptions: {
            durable: false
          }
        }
      }
    ]
  })],
  controllers: [TodoController],
  providers: [TodoService, ...todoProviders]
})
export class TodoModule { }
