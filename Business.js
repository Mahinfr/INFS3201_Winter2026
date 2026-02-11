const persistence = require("./Persistence")

async function getAllEmployees(){
    return persistence.getAllEmployees()
}


async function getEmployeeShifts(emp){
    return persistence.getEmployeeShifts(emp)
}

async function addEmployeeRecord(emp){
    return persistence.addEmployeeRecord(emp)
}

async function assignShift(empId,shiftId){
    return persistence.assignShift(empId,shiftId)
}

module.exports ={
    getAllEmployees,//
    getEmployeeShifts,//
    addEmployeeRecord,//
    assignShift//

}