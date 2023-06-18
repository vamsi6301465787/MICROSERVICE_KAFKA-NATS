import {kafka_server } from "./admin";
import { Kafka, Partitioners } from "kafkajs";
const kafka = new Kafka({
  clientId: "my-app",
  brokers: [kafka_server],
});

const isFunction = (x) => {
    return Object.prototype.toString.call(x) === '[object Function]';
  }
 const  isArray=(x)=> {
    return Object.prototype.toString.call(x) === '[object Array]';
  }
  const isDate= (x)=> {
    return Object.prototype.toString.call(x) === '[object Date]';
  }
  const  isObject= (x)=> {
    return Object.prototype.toString.call(x) === '[object Object]';
  }
  const isValue= (x)=> {
    return !isObject(x) && !isArray(x);
  }
  const compareValues=(value1, value2) =>{
    if (value1 === value2) {
      return "unchanged";
    }
    if (isDate(value1) && isDate(value2) && value1.getTime() === value2.getTime()) {
      return "unchanged";
    }
    if (value1 === undefined) {
      return "created";
    }
    if (value2 === undefined) {
      return "deleted";
    }
    return "updated";
  }
const compareObjects =  (obj1: { [x: string]: any; },obj2: { [x: string]: any; }) => {
    try {

        if (isFunction(obj1) || isFunction(obj2)) {
            throw 'Invalid argument. Function given, object expected.';
          }
          if (isValue(obj1) || isValue(obj2)) {
            let type= compareValues(obj1, obj2)
            // if(type ==="created"||type ==="updated"||type ==="deleted")
            return {
              type: compareValues(obj1, obj2),
              newData: obj2 === undefined ? "Record is deleted" : obj2,
              previousData:obj1 === undefined ? "No data in previous" : obj1,
            };
          }
    
          var diff = {};
          for (var key in obj1) {
            if (isFunction(obj1[key])) {
              continue;
            }
    
            var value2 = undefined;
            if (obj2[key] !== undefined) {
              value2 = obj2[key];
            }
    
            diff[key] = compareObjects(obj1[key], value2);
          }
          for (var key in obj2) {
            if (isFunction(obj2[key]) || diff[key] !== undefined) {
              continue;
            }
    
            diff[key] = compareObjects(undefined, obj2[key]);
          }
    
          return diff;
    } catch (e) {
      console.log(e);
    }
  };
export async function createAuditLog(request: any) {
      try {
    const {previousData,newData,event,type,id=""} = request
    let data = compareObjects(previousData,newData)
    let changedData =Object.fromEntries(Object.entries(data).filter(([key,value]) => 
        value["type"] !== "unchanged"
    ))
    let loggedData = {
        ...changedData,
        id:id
    }

   console.log(event,request)

    if (!request) {
      throw new Error("invalid-inputs");
    }
    const producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    await producer.connect();
      const outgoingMessage = {
        key: `create#${id.toString()}`,
        value: JSON.stringify({
            user: newData.createdBy,
            event: event,
            type:type,
            Data: loggedData,
            createdAt: new Date().toISOString(),
            message:"",
            level:"",
            eventId:""
        }), 
      };
      await producer.send({
        topic: "Auditing-logs",
        messages: [outgoingMessage],
      });
      console.log("Auditing logged sucessfully");
      return {
        status: 201,
        body: request,
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

    return {
      status: 404,
      body: {
        message: "something went wrong",
      },
    };
  }
}
