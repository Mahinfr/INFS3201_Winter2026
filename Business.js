const persistence = require("./Persistence")

/**
 * Return a list of all employees loaded from the storage.
 * @returns {Array<{ employeeId: string, name: string, phone: string }>} List of employees
 */
async function getAllEmployees(){
    return persistence.getAllEmployees()
}

/**
 * Get a list of shiftIDs for an employee.
 * @param {string} empId 
 * @returns {Array<{string}>}
 */
async function getEmployeeShifts(emp){
    return persistence.getEmployeeShifts(emp)
}

/**
 * Add a new employee record to the system. The empId is automatically generated based
 * on the next available ID number from what is already in the file.
 * @param {{name:string, phone:string}} emp 
 */
async function addEmployeeRecord(emp){
    return persistence.addEmployeeRecord(emp)
}

/**
 * This function attempts to assign a shift to an employee. This function checks to ensure
 * that the employee exists, the shift exists, and that the combination employee/shift has 
 * not already been recorded.
 * 
 * The function currently returns string messages indicating whether the operation was successful
 * or why it failed.  A serious improvement would be to use exceptions; this will be refactored
 * at a later time.
 * 
 * @param {string} empId 
 * @param {string} shiftId 
 * @returns {string} A message indicating the problem of the word "Ok"
 */
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


    await persistence.addAssignment(empId, shiftId)
    return "Ok"
}


module.exports ={
    getAllEmployees,//
    getEmployeeShifts,//
    addEmployeeRecord,//
    assignShift//

}