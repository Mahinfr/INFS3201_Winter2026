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
 * Find a single employee given their ID number.
 * @param {string} empId 
 * @returns {{ employeeId: string, name: string, phone: string }|undefined}
 */
async function findEmployee(emp){
    return persistence.findEmployee(emp)
}




module.exports ={
    getAllEmployees,//
    getEmployeeShifts,//
    addEmployeeRecord,//
    findEmployee
    

}