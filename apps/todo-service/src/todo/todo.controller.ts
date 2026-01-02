import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Inject,
    Logger,
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
    private readonly logger = new Logger(TodoController.name);

    constructor(
        @Inject('RABBIT_MQ') private readonly rabbitClient: ClientProxy,
        private readonly todoService: TodoService,
    ) { }

    private async sendCommand<T>(pattern: any, payload: any): Promise<T> {
        try {
            const result = await lastValueFrom(this.rabbitClient.send(pattern, payload));
            if (result && typeof result === 'object' && 'error' in result) {
                throw new HttpException(result.error, result.status || HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return result as T;
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(`Command failed: ${JSON.stringify(pattern)}`, err instanceof Error ? err.stack : String(err));
            throw new HttpException(
                err instanceof Error ? err.message : 'Internal Server Error',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post()
    @UseGuards(AuthGuard)
    async createTodo(@Body() createTodoDto: CreateTodoDto, @User() user: IUser) {
        const payload: CreateTodoQueueDto = { ...createTodoDto, user_id: user.uid };
        return this.sendCommand({ cmd: 'todo.create' }, payload);
    }

    @Get()
    @UseGuards(AuthGuard)
    async listTodos(
        @Query('hide_completed') hideCompleted: 'false' | 'true' = 'false',
        @Query('query') query: string | undefined,
        @User() user: IUser,
    ) {
        try {
            return await this.todoService.getTodos(
                hideCompleted === 'true',
                user.uid,
                query
            );
        } catch (err) {
            this.logger.error('Failed to fetch todos', err instanceof Error ? err.stack : String(err));
            throw new HttpException(
                `Failed to fetch todos: ${err instanceof Error ? err.message : String(err)}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put('toggle')
    @UseGuards(AuthGuard)
    async toggleTodo(@User() user: IUser, @Body() body: ToggleTodoDTO) {
        return this.sendCommand({ cmd: 'todo.toggle_done' }, { ...body, user_id: user.uid });
    }

    @Delete()
    @UseGuards(AuthGuard)
    async deleteTodo(@User() user: IUser, @Body() body: DeleteTodoDto) {
        await this.sendCommand({ cmd: 'todo.delete' }, { ...body, user_id: user.uid });
        return { success: true };
    }

    @Put()
    @UseGuards(AuthGuard)
    async updateTodo(@User() user: IUser, @Body() body: UpdateTodoDto) {
        const payload: UpdateTodoQueueDto = { ...body, user_id: user.uid };
        return this.sendCommand({ cmd: 'todo.update' }, payload);
    }

    @MessagePattern({ cmd: 'todo.create' })
    async handleCreateTodo(@Payload() payload: CreateTodoQueueDto) {
        try {
            return await this.todoService.createTodo(payload);
        } catch (err) {
            this.logger.error('Error handling create todo message', err instanceof Error ? err.stack : String(err));
            return { 
                error: err instanceof Error ? err.message : 'Unknown error', 
                status: (err as any).status || 500 
            };
        }
    }

    @MessagePattern({ cmd: 'todo.toggle_done' })
    async handleToggleTodoDone(@Payload() payload: ToggleTodoQueuePayloadDto) {
        try {
            return await this.todoService.toggleDone(payload.id, payload.user_id);
        } catch (err) {
            this.logger.error('Error handling toggle todo message', err instanceof Error ? err.stack : String(err));
            return { 
                error: err instanceof Error ? err.message : 'Unknown error', 
                status: (err as any).status || 500 
            };
        }
    }

    @MessagePattern({ cmd: 'todo.delete' })
    async handleTodoDelete(@Payload() payload: DeleteTodoQueueDto) {
        try {
            return await this.todoService.deleteTodo(payload.id, payload.user_id);
        } catch (err) {
            this.logger.error('Error handling delete todo message', err instanceof Error ? err.stack : String(err));
            return { 
                error: err instanceof Error ? err.message : 'Unknown error', 
                status: (err as any).status || 500 
            };
        }
    }

    @MessagePattern({ cmd: 'todo.update' })
    async handleUpdateTodo(@Payload() payload: UpdateTodoQueueDto) {
        try {
            return await this.todoService.updateTodo(payload.id, payload.user_id, payload);
        } catch (err) {
            this.logger.error('Error handling update todo message', err instanceof Error ? err.stack : String(err));
            return { 
                error: err instanceof Error ? err.message : 'Unknown error', 
                status: (err as any).status || 500 
            };
        }
    }
}

