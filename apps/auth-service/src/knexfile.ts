import type { Knex } from "knex";

const config: Knex.Config = {
  client: "pg",
  connection: {
    connectionString: process.env.AUTH_DATABASE_URL as string,
    ssl: {
      rejectUnauthorized: false
    }
  },
  pool: { min: 2, max: 10 },
  migrations: { tableName: "knex_migrations" },
  
};

export default config;
