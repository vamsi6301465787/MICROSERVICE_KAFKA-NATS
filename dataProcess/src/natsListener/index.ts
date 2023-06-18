import { connect } from "nats";
import { nat_server } from "../admin";
import { StudentNats } from "./student";

const StudentNatsService = new StudentNats();
export async function natsSubscriber() {
  const nc = await connect({ servers: nat_server })
    .then((con) => {
      console.log("nats cconnection success");
      return con;
    })
    .catch((err) => {
      console.log(`nats error: ${err}`);
      return null;
    });
  if (nc != null) {
    StudentNatsService.studentNatsSubscriber(nc);
  }
}
