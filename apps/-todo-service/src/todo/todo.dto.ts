import { IsNumber, IsString, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTodoDto {
    @IsString()
    text: string;

    @IsNumber()
    priority: 1 | 2 | 3;
}

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
    @IsString()
    id: string    
}

export class UpdateTodoQueueDto extends UpdateTodoDto {
    user_id: string
}

export class CreateTodoQueueDto extends CreateTodoDto {
    @IsUUID()
    user_id: string
}

export class ToggleTodoDTO {
    @IsString()
    id: string;
}

export class ToggleTodoQueuePayloadDto extends ToggleTodoDTO {
    @IsString()
    user_id: string
}

export class DeleteTodoDto {
    @IsString()
    id: string
}

export class DeleteTodoQueueDto extends DeleteTodoDto {
    @IsString()
    user_id: string
}