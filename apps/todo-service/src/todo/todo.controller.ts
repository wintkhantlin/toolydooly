import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Inject,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
    CreateTodoDto,
    CreateTodoQueueDto,
    DeleteTodoDto,
    DeleteTodoQueueDto,
    ToggleTodoDTO,
    ToggleTodoQueuePayloadDto,
    UpdateTodoDto,
    UpdateTodoQueueDto,
} from './todo.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/user/user.decoration';
import type { IUser } from 'src/user/user.type';
import { TodoService } from './todo.service';

@Controller()
export class TodoController {
    constructor(
        @Inject('RABBIT_MQ') private readonly rabbitClient: ClientProxy,
        private readonly todoService: TodoService,
    ) { }

    @Post()
    @UseGuards(AuthGuard)
    async createTodo(@Body() createTodoDto: CreateTodoDto, @User() user: IUser) {
        const payload: CreateTodoQueueDto = { ...createTodoDto, user_id: user.uid };
        try {
            const result = await lastValueFrom(this.rabbitClient.send({ cmd: 'todo.create' }, payload));
            if (result?.error) throw new HttpException(result.error, result.status);
            return result;
        } catch (err) {
            console.error(err)
            throw new HttpException(`Failed to create todo: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get()
    @UseGuards(AuthGuard)
    async listTodos(
        @Query('hide_completed') hideCompleted: 'false' | 'true' = 'false',
        @Query('query') query: string | undefined,
        @User() user: IUser,
    ) {
        const hideCompletedBool = hideCompleted === 'true';

        try {
            return await this.todoService.getTodos(
                hideCompletedBool,
                user.uid,
                query
            );
        } catch (err: any) {
            throw new HttpException(`Failed to fetch todos: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put('toggle')
    @UseGuards(AuthGuard)
    async toggleTodo(@User() user: IUser, @Body() body: ToggleTodoDTO) {
        try {
            const todo = await lastValueFrom(
                this.rabbitClient.send(
                    { cmd: 'todo.toggle_done' },
                    { ...body, user_id: user.uid } as ToggleTodoQueuePayloadDto,
                ),
            );

            if (todo?.error) throw new HttpException(todo.error, todo.status);
            return todo;
        } catch (err: any) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete()
    @UseGuards(AuthGuard)
    async deleteTodo(@User() user: IUser, @Body() body: DeleteTodoDto) {
        try {
            const result = await lastValueFrom(
                this.rabbitClient.send({ cmd: 'todo.delete' }, { ...body, user_id: user.uid } as DeleteTodoQueueDto),
            );

            if (result?.error) throw new HttpException(result.error, result.status);
            return { success: true };
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put()
    @UseGuards(AuthGuard)
    async updateTodo(@User() user: IUser, @Body() body: UpdateTodoDto) {
        const payload: UpdateTodoQueueDto = { ...body, user_id: user.uid };
        try {
            const result = await lastValueFrom(this.rabbitClient.send({ cmd: 'todo.update' }, payload));
            if (result?.error) throw new HttpException(result.error, result.status);
            return result;
        } catch (err: any) {
            throw new HttpException(`Failed to update todo: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @MessagePattern({ cmd: 'todo.create' })
    async handleCreateTodo(@Payload() payload: CreateTodoQueueDto) {
        try {
            return await this.todoService.createTodo(payload);
        } catch (err: any) {
            return { error: err.message, status: err.status || 500 };
        }
    }

    @MessagePattern({ cmd: 'todo.toggle_done' })
    async handleToggleTodoDone(@Payload() payload: ToggleTodoQueuePayloadDto) {
        try {
            return await this.todoService.toggleDone(payload.id, payload.user_id);
        } catch (err: any) {
            return { error: err.message, status: err.status || 500 };
        }
    }

    @MessagePattern({ cmd: 'todo.delete' })
    async handleTodoDelete(@Payload() payload: DeleteTodoQueueDto) {
        try {
            return await this.todoService.deleteTodo(payload.id, payload.user_id);
        } catch (err: any) {
            return { error: err.message, status: err.status || 500 };
        }
    }

    @MessagePattern({ cmd: 'todo.update' })
    async handleUpdateTodo(@Payload() payload: UpdateTodoQueueDto) {
        try {
            return await this.todoService.updateTodo(payload.id, payload.user_id, payload); // implement in service
        } catch (err: any) {
            return { error: err.message, status: err.status || 500 };
        }
    }
}
