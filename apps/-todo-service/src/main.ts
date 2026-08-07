import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.QUEUE_URL as string],
      queue: "app_queue",
      queueOptions: {
        durable: false
      }
    }
  });

  await app.startAllMicroservices();
  
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3003);
}

bootstrap();
