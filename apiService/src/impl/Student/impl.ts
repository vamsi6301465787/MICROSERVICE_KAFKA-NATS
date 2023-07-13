import { Api } from "../../../dist/models";
import * as t from "../../../dist/api/student/types";
import * as v from "../../../dist/validation";
import { v4 } from "uuid";
import { Kafka, Partitioners } from "kafkajs";
import { nat_server } from "../../admin";
import { kafka_server } from "../../admin";
const kafka = new Kafka({
	clientId: "my-app",
	brokers: [kafka_server],
});
import { connect, StringCodec } from "nats";
import { TextEncoder } from "text-encoding";



export class StudentService {
	constructor() {
		this.getAll = this.getAll.bind(this);
		this.get = this.get.bind(this);
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
		this.delete = this.delete.bind(this);
	}

	/* *
	 ! Todo: Implement pagination for this service
	*/
	async getAll(departmentno: string,limit: number | undefined, direction: Api.DirectionParamEnum | undefined, sortByField: string | null | undefined): Promise<t.GetGetAllStudentResponse> {
		try {
			const nc = await connect({ servers: nat_server });
			const sc = StringCodec();
			const data = {
				departmentno:departmentno,
				type: "getAll"
			};
			const ddata = JSON.stringify(data);
			const encoder = new TextEncoder();
			const enc = encoder.encode(ddata);
			const m = await nc.request("student", enc, { timeout: 1000 });
			console.log({ data: sc.decode(m.data) });
			const natsOutput = JSON.parse(sc.decode(m.data));
			console.log(natsOutput);
			const student: Api.StudentDto[] = natsOutput.map((item: any) =>
				v.modelApiStudentDtoFromJson("student", item)
			);
			console.log({ student });
			if (natsOutput == 404) {
				await nc.close();
				return {
					status: 404,
					body: { message: `No student found` },
				};
			} else {
				const note1 : Api.StudentDetails = {
					totalCount: student.length,
					items: student,
				};
				await nc.close();
				return {
					status: 200,
					body: note1,
				};
			}
		} catch (error) {
			console.error(error);
			return {
				status: 404,
				body: { message: `something went wrong` },
			};
		}
	}

	async get(id: string): Promise<t.GetGetStudentResponse> {
		try {
			const nc = await connect({ servers: nat_server });
			const sc = StringCodec();
			const data = {
				id: id,
				type: "get",
			};
			const ddata = JSON.stringify(data);
			const encoder = new TextEncoder();
			const enc = encoder.encode(ddata);
			const m = await nc.request("student", enc, { timeout: 1000 });
			const natsOutput = JSON.parse(sc.decode(m.data));

			if (natsOutput == "404") {
				await nc.close();
				return {
					status: 404,
					body: { message: `No student found` },
				};
			} else {
				const student = JSON.parse(JSON.stringify(natsOutput));
				console.log({ student });
				await nc.close();
				return {
					status: 200,
					body: student,
				};
			}
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("no-student-found")) {
				return {
					status: 404,
					body: {
						message: "No student found with given id",
					},
				};
			}
			return {
				status: 404,
				body: { message: `something went wrong` },
			};
		}
	}

	async create(request: Api.StudentDto): Promise<t.PostStudentRegisterResponse> {
		try {
			if (!request) {
				throw new Error("invalid-inputs");
			}
			request.id = v4();
			const studentRequest = JSON.parse(JSON.stringify(request));
			console.log({ studentRequest });
			try {
				const producer = kafka.producer({
					createPartitioner: Partitioners.DefaultPartitioner,
				});
				await producer.connect();
				const outgoingMessage = {
					key: `create#${request.id.toString()}`,
					value: JSON.stringify({
						...studentRequest,
						isExist: true,
						createdAt: new Date().toISOString(),
					}),
				};
				await producer.send({
					topic: "student",
					messages: [outgoingMessage],
				});
				return {
					status: 201,
					body: request,
				};
			} catch (error: any) {
				if (error.toString().match("no-id-found")) {
					throw new Error("no-id-found");
				}
				throw error;
			}
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "Invalid request",
					},
				};
			}

			if (error.toString().match("no-id-found")) {
				return {
					status: 422,
					body: {
						message: "No id found in request",
					},
				};
			}

			if (error.toString().match("student-id-already-exist")) {
				return {
					status: 422,
					body: {
						message: "student already exists with given date",
					},
				};
			}
			return {
				status: 404,
				body: { message: `something went wrong` },
			};
		}
	}

	async update(request: Api.StudentDto): Promise<t.PutUpdateStudentResponse> {
		try {
			if (!request) {
				throw new Error("invalid-inputs");
			}

			if (!request.id) {
				throw new Error("no-id-found");
			}

			const checknote = await this.get(request.id);

			if (checknote.status == 404) {
				throw new Error("no-student-found");
			}
			const producer = kafka.producer({
				createPartitioner: Partitioners.DefaultPartitioner,
			});
			await producer.connect();
			const noteRequest = JSON.parse(JSON.stringify(request));
			console.log({ noteRequest });
			const outgoingMessage = {
				key: `update#${noteRequest.id.toString()}`,
				value: JSON.stringify({
					...noteRequest,
					updatedAt: new Date().toISOString(),
				}),
			};
			await producer.send({
				topic: "student",
				messages: [outgoingMessage],
			});
			return {
				status: 200,
				body: {
					...noteRequest,
				},
			};
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "Invalid request",
					},
				};
			}

			if (error.toString().match("no-id-found")) {
				return {
					status: 422,
					body: {
						message: "No id found in request",
					},
				};
			}

			if (error.toString().match("no-student-found")) {
				return {
					status: 422,
					body: {
						message: "no student found to update",
					},
				};
			}

			return {
				status: 422,
				body: {
					message: "something went wrong",
				},
			};
		}
	}

	async delete(id: string): Promise<t.DeleteDeleteStudentResponse> {
		try {
			const checkstudent = await this.get(id);
			if (checkstudent.status == 404) {
				throw new Error("no-student-found");
			}
			if (checkstudent.status === 200) {
				const producer = kafka.producer({
					createPartitioner: Partitioners.DefaultPartitioner,
				});
				await producer.connect();
				const data = checkstudent.body;
				data.isExist = false;
				const outgoingMessage = {
					key: `update#${id.toString()}`,
					value: JSON.stringify({
						...data,
						updatedAt: new Date().toISOString(),
					}),
				};
				await producer.send({
					topic: "student",
					messages: [outgoingMessage],
				});
				return {
					status: 200,
					body: {
						message: `student deleted successfully`,
					},
				};
			}
			throw new Error("something-went-wrong");
		} catch (error: any) {
			console.error(error?.response?.status);
			return {
				status: 404,
				body: {
					message: "student already deleted or no student found",
				},
			};
		}
	}
}
