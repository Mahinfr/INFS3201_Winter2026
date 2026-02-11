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



async function assignShift(empId, shiftId) {
    // check employee exists
    let employee = await persistence.findEmployee(empId)
    if (!employee) return "Employee does not exist"

    // check shift exists
    let shift = await persistence.findShift(shiftId)
    if (!shift) return "Shift does not exist"

    // check assignment already exists
    let assignment = await persistence.findAssignment(empId, shiftId)
    if (assignment) return "Employee already assigned to shift"

    // read config
    let config = await persistence.readConfig()
    let maxDailyHours = config.maxDailyHours

    // get all shifts already assigned to this employee
    let assignedShifts = await persistence.getEmployeeShifts(empId)

    // calculate total hours for that day
    let totalHours = 0
    for (let s of assignedShifts) {
        if (s.date === shift.date) {
            totalHours += persistence.computeShiftDuration(s.startTime, s.endTime)
        }
    }

    // add new shift duration
    let newShiftHours = persistence.computeShiftDuration(shift.startTime, shift.endTime)
    if (totalHours + newShiftHours > maxDailyHours) {
        return `Cannot assign shift: exceeds daily limit of ${maxDailyHours} hours`
    }

    // safe to assign
    await persistence.addAssignment(empId, shiftId)
    return "Ok"
}


module.exports ={
    getAllEmployees,//
    getEmployeeShifts,//
    addEmployeeRecord,//
    assignShift//

}