import { Provider } from "@nestjs/common";
import { Connection } from "mongoose";
import { TodoSchema } from "src/schemas/todo.schema";

export const todoProviders: Provider[] = [
    {
        provide: "TODO_MODEL",
        useFactory: (connection: Connection) => connection.model("Todo", TodoSchema),
        inject: ["DATABASE_CONNECTION"]
    }
]