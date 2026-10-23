import { Sequelize } from "sequelize";
import { env } from "./env";

const isRDS = env.databaseUrl.includes(".rds.amazonaws.com");

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: false,
  // A laptop reaching the database through an SSH tunnel pays ~2s per new
  // connection, so local dev keeps a few warm (DB_POOL_MIN / DB_POOL_IDLE_MS in
  // .env). The server leaves both unset and keeps the defaults.
  pool: {
    max: 10,
    min: Number(process.env.DB_POOL_MIN ?? 0),
    acquire: 30000,
    idle: Number(process.env.DB_POOL_IDLE_MS ?? 10000),
  },
  ...(isRDS && {
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  }),
});
