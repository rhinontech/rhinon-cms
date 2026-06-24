import { Sequelize } from "sequelize";
import { env } from "./env";

const isRDS = env.databaseUrl.includes(".rds.amazonaws.com");

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  ...(isRDS && {
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  }),
});
