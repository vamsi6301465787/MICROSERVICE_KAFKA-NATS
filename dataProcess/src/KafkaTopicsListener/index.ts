import { studentTopicsListening } from "./student";

const studentTopicsService = new studentTopicsListening();

export async function kafkaTopicsListening() {
  studentTopicsService.studentTopicsListening();
}
