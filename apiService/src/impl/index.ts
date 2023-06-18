import {  StudentApi } from "../../dist/api/student/types";
import { ApiImplementation } from "../../dist/types";
import { studentServiceImpl } from "./Student";

export class ServiceImplementation implements ApiImplementation {
	student: StudentApi = studentServiceImpl;

}
