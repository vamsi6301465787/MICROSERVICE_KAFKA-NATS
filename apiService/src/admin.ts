import dotenv from "dotenv";
dotenv.config();

export const nat_server = process.env.NATS!;
export const kafka_server = process.env.KAFKA!;