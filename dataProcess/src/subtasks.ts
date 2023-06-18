import {kafka_server } from "./admin";
import { Kafka, Partitioners } from "kafkajs";
const kafka = new Kafka({
  clientId: "my-app",
  brokers: [kafka_server],
});



export async function create(request: any) {
  try {
    if (!request) {
      throw new Error("invalid-inputs");
    }
    const producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    await producer.connect();
      const outgoingMessage = {
        key: `create#${request.subtaskId.toString()}`,
        value: JSON.stringify({
          ...request,
          isExist: true,
          createdAt: new Date().toISOString(),
        }),
      };
      await producer.send({
        topic: "subtasks1",
        messages: [outgoingMessage],
      });
      console.log("subtask sent", request.subtaskId);
      return {
        status: 201,
        body: request,
      };
    }
  //   throw Error("err1");
  // }
   catch (error: any) {
    console.error(error);
    if (error.toString().match("invalid-inputs")) {
      return {
        status: 422,
        body: {
          message: "Invalid request",
        },
      };
    }

    return {
      status: 404,
      body: {
        message: "something went wrong",
      },
    };
  }
}

export async function update(request: any) {
  try {
    if (!request) {
      throw new Error("invalid-inputs");
    }
    const producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    await producer.connect();
      const outgoingMessage = {
        key: `update#${request.subtaskId.toString()}`,
        value: JSON.stringify({
          ...request,
        }),
      };
      await producer.send({
        topic: "subtasks1",
        messages: [outgoingMessage],
      });
      console.log("subtask sent", request.subtaskId);
      return {
        status: 201,
        body: request,
      };
    }
  //   throw Error("err1");
  // }
   catch (error: any) {
    console.error(error);
    if (error.toString().match("invalid-inputs")) {
      return {
        status: 422,
        body: {
          message: "Invalid request",
        },
      };
    }

    return {
      status: 404,
      body: {
        message: "something went wrong",
      },
    };
  }
}
