const persistence = require("./Persistence")
const crypto = require('crypto')

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

/**
 * Get a single shift given the shiftId
 * @param {string} shiftId 
 * @returns {{shiftId:string, date:string, startTime:string, endTime:string}|undefined}
 */
async function findShift(shiftId) {
    return persistence.findShift(shiftId)
}


async function updateDetails(eid,newName,newPhone) {
    return persistence.updateDetails(eid,newName,newPhone)
}

/**
 * Processes a list of shift objects and adds a boolean 'isMorning' property 
 * to each based on the startTime. 
 *
 * @param {Array<{startTime: string, date: string, endTime: string}>} shifts 
 * @returns {Promise<void>} This function modifies the objects in the array directly.
 */
async function isMorning(shifts){
    for(let s of shifts){
        
        let hour = parseInt(s.startTime.split(':')[0]);
        
        if (hour < 12) {
            s.isMorning = true;
        } else {
            s.isMorning = false;
        }
    }
}

async function attemptLogin(u, p) {
    let details = await persistence.getUserDetails(u)
    const hash = crypto.createHash('sha256').update(p).digest('hex')
    console.log(hash)
    if (details == undefined || details.password != hash) {
        return undefined
    }
    
    let sessionKey = crypto.randomUUID()
    let sd = {
        key: sessionKey,
        expiry: new Date(Date.now() + 1000*60*5),
        data: {
            username: details.user
        }
    }

    await persistence.startSession(sd)
    return sd
}
async function getSession(key){
    return persistence.getSession(key)
}




module.exports ={
    getAllEmployees,//
    getEmployeeShifts,//
    addEmployeeRecord,//
    findEmployee,
    findShift,
    isMorning,
    updateDetails,
    attemptLogin,
    getSession
}