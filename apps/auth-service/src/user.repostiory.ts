import knex from "knex";
import config from "./knexfile";
import { User } from "./types/knex";

export const db = knex(config);

export const findUserByIdentifier = (identifier: string): Promise<User | undefined> =>
    db<User>("users")
        .where(function () {
            this.where("email", identifier).orWhere("username", identifier);
        })
        .andWhere("is_active", true)
        .first();

export const findUserById = (uid: string): Promise<User | undefined> =>
    db<User>("users")
        .where("uid", uid)
        .andWhere("is_active", true)
        .first();

export const createUser = async (user: Partial<User>): Promise<User> => {
    const [createdUser] = await db<User>("users").insert(user).returning("*");
    return createdUser;
};

export const updateUserPassword = async (id: string, password: string): Promise<User> => {
    const [updatedUser] = await db<User>("users")
        .where("uid", id)
        .update({
            password,
            password_changed_at: db.fn.now(),
        })
        .returning("*");

    return updatedUser;
};
