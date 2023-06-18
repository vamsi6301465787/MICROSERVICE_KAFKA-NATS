import { StudentService } from "./impl";
import * as t from "../../../dist/api/student/types";

const service = new StudentService();

export const studentServiceImpl: t.StudentApi = {
	postStudentRegister: service.create,
	deleteDeleteStudent: service.delete,
	getGetStudent: service.get,
	getGetAllStudent: service.getAll,
	putUpdateStudent: service.update,
};
