const persistence = require("./Persistence")

async function getAllEmployees(){
    return persistence.getAllEmployees
}

async function findEmployee(){
    return persistence.findEmployee()
}
async function findShift(){
    return persistence.findShift()
}
async function findAssignment(){
    return persistence.findAssignment()
}
async function getEmployeeShifts(){
    return persistence.getEmployeeShifts()
}
async function addAssignment(){
    return persistence.addAssignment()
}
async function addEmployeeRecord(){
    return persistence.addEmployeeRecord()
}

module.exports ={
    getAllEmployees,
    findEmployee,
    findShift,
    findAssignment,
    getEmployeeShifts,
    addAssignment,
    addEmployeeRecord

}