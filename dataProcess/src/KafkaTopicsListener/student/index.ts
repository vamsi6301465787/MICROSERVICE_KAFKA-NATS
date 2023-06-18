import { Kafka } from "kafkajs";
import { kafka_server } from "../../admin";
import { db } from "../../db";

const kafka = new Kafka({
  clientId: "my-app",
  brokers: [kafka_server],
});

export var studentStore = {};

export class studentTopicsListening {
  async studentTopicsListening() {
    var latestCount;
    const topicRef = await db.collection("STUDENT_GROUP").doc("student").get();
    if (topicRef.data()) {
      var count = topicRef.data().count + 1;
      await topicRef.ref.update({ count: count });
      latestCount = count;
    } else {
      const topicRef = db.collection("CONSUMER_GROUP").doc("student");
      await topicRef.set({
        count: 1,
        consumer_group_name: "student",
      });
      latestCount = 1;
    }
    if (latestCount) {
      const consumer = kafka.consumer({
        groupId: `student-group${latestCount}`,
      });
      await consumer.connect();
      await consumer.subscribe({ topic: "student", fromBeginning: true });
      await consumer.run({
        eachMessage: async (data) => {
          const { topic, partition, message } = data;
          const operation = message.key.toString().split("#")[0];
          const key = message.key.toString().split("#")[1];
          if (operation == "create" && message.value) {
            const obj = JSON.parse(message.value.toString("utf8"));
            studentStore[key] = obj;
            console.log("data sent to local");
          } else if (operation == "update" && message.value) {
            const obj = JSON.parse(message.value.toString("utf8"));
            let result = studentStore[key];
            studentStore[key] = {
              ...result,
              ...obj,
            };
            console.log("data updated in store");
          } else if (operation == "delete" && message.value) {
            const obj = JSON.parse(message.value.toString("utf8"));
            studentStore[key] = obj;
            let result = studentStore[key];
            studentStore[key] = {
              ...result,
              ...obj,
            };
          }
        },
      });
    }
  }
}
