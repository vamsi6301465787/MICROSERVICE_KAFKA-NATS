import express from "express";
import http from "http";
import bodyParser from "body-parser";

import cron from "node-cron";
import { kafkaTopicsListening } from "./src/KafkaTopicsListener";
import { natsSubscriber } from "./src/natsListener";

const app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`This dataProcess micro service is working, v10.10!!!`);
});

const port = process.env.PORT ?? 8000;

kafkaTopicsListening();
natsSubscriber();

http.createServer(app).listen(port, () => {
  console.log(`app running on 'http://localhost:${port}`);
});

