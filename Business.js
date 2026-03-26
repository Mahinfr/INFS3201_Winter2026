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

/**
 * Updates an employee's name and phone number in the database.
 * Looks up the employee by their MongoDB ObjectId.
 * @param {string} empId - The string representation of the employee's ObjectId
 * @param {string} newName - The new name to assign to the employee
 * @param {string} newPhone - The new phone number to assign to the employee
 * @returns {Promise<void>}
 */
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

/**
 * Attempts to log in a user by verifying their credentials against the database.
 * If successful, creates and stores a new session with a 5 minute expiry.
 * @param {string} u - The username to authenticate
 * @param {string} p - The plain text password to verify
 * @returns {Promise<{ key: string, expiry: Date, data: { username: string } }|undefined>} The session object if login successful, undefined otherwise
 */
async function attemptLogin(u, p) {
    let details = await persistence.getUserDetails(u)
    const hash = crypto.createHash('sha256').update(p).digest('hex')
    if (details == undefined || details.password != hash) {
        return undefined
    }
    
    let sessionKey = crypto.randomUUID()
    let sd = {
        key: sessionKey,
        expiry: new Date(Date.now() + 1000*60*5),
        data: {
            username: details.username
        }
    }

    await persistence.startSession(sd)
    return sd
}

/**
 * Retrieves a session document from the session collection by its key.
 * @param {string} key - The unique session key to search for
 * @returns {Promise<{ key: string, expiry: Date, data: { username: string } }|null>}
 */
async function getSession(key){
    return persistence.getSession(key)
}

/**
 * Deletes a session document from the session collection by its key.
 * @param {string} key - The unique session key of the session to delete
 * @returns {Promise<void>}
 */
async function terminateSession(key){
    return await persistence.terminateSession(key)
}

/**
 * Extends the expiry of an existing session by 5 minutes from the current time.
 * @param {string} sessionKey - The unique session key to extend
 * @returns {Promise<void>}
 */
async function extendSession(sessionKey) {
    return persistence.extendSession(sessionKey)
}

/**
 * Logs a security access entry to the database.
 * @param {{ timestamp: Date, username: string|undefined, url: string, method: string }} entry
 * @returns {Promise<void>}
 */
async function logAccess(entry) {
    return persistence.logAccess(entry)
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
    getSession,
    terminateSession,
    extendSession,
    logAccess
}