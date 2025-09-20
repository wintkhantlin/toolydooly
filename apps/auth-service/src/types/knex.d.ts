import "knex";

export interface User {
    uid: string;
    username: string;
    email: string;
    password: string;
    is_active: boolean;
    password_changed_at: Date;
    created_at: Date;
}

declare module "knex/types/tables" {
    interface Tables {
        users: Knex.CompositeTableType<
            User,
            // insert type
            Partial<Pick<User, "uid" | "created_at" | "password_changed_at">> &
            Omit<User, "uid" | "created_at" | "password_changed_at">,
            // update type
            Partial<Omit<User, "uid">>
        >;
    }
}
