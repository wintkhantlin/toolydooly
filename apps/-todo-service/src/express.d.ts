import { IUser } from "./user/user.type";

declare module "express" {
    interface Request {
        user?: IUser
    }
}