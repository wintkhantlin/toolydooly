import 'knex';

declare module 'knex/types/tables' {
    export interface User {
        uid: string;
        username: string;
        email: string;
        password: string;
        is_active: boolean;
        created_at: Date;
    }

    interface Tables {
        users: Knex.CompositeTableType<
            User,
            Partial<Pick<User, 'uid' | 'created_at'>>,
            Partial<Omit<User, 'uid'>>
        >
    }
}
