import { NatsConnection, StringCodec, Subscription } from "nats";
import { studentStore } from "../../KafkaTopicsListener/student";

export class StudentNats {
  async studentNatsSubscriber(nc: NatsConnection) {
    const sc = StringCodec();
    const sub = nc.subscribe("student");
    (async (sub: Subscription) => {
      console.log(`listening for ${sub.getSubject()} requests...`);
      for await (const m of sub) {
        const decoder = new TextDecoder("utf-8");
        const payload = JSON.parse(decoder.decode(m.data));
        if (payload.type == "get") {
          const finalres = studentStore[payload.id];
          if (finalres && finalres.isExist == true) {
            if (m.respond(sc.encode(JSON.stringify(finalres)))) {
              console.info(`[student] handled #${sub.getProcessed()}`);
            } else {
              console.log(
                `[student] #${sub.getProcessed()} ignored - no reply subject`
              );
            }
          } else {
            console.log("not found");
            if (m.respond(sc.encode("404"))) {
              console.info(`[student] handled #${sub.getProcessed()}`);
            } else {
              console.log(
                `[student] #${sub.getProcessed()} ignored - no reply subject`
              );
            }
          }
        } else if (payload.type == "getAll") {
          const allstudent: any = studentStore;
          // const limit = payload.limit;
          let finalRes = Object.values(allstudent).filter((item: any) => {
            return item.id == payload.id && item.isExist;
          });
          // if (limit) {
          //   finalRes = finalRes.slice(0, limit);
          // }

          if (m.respond(sc.encode(JSON.stringify(finalRes)))) {
            console.info(`[student] handled #${sub.getProcessed()}`);
          } else {
            console.log(
              `[student] #${sub.getProcessed()} ignored - no reply subject`
            );
          }
        }
      }
      console.log(`subscription ${sub.getSubject()} drained.`);
    })(sub);
  }
}
