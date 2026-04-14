const persistence = require("./Persistence")
const emailSystem = require("./emailSystem")
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

    if(!details) return{status : 'invalid'}
    if(details.locked) return{status : 'locked'}

    if (details.password != hash) {
        let attempts = (details.failedAttempts || 0) + 1
        let locked = attempts >= 10

        await persistence.updateLoginAttempts(u, attempts, locked)

        if(locked){
            await emailSystem.sendAccountLockedEmail(details.email) /// no email field created in mongodb yet
            return {status : 'locked'}
        }
        if (attempts === 3) {
            await emailSystem.sendSuspiciousActivityEmail(details.email)
        }
        return { status: 'invalid' }
    }

    // Credentials correct, reset attempts and send 2FA
    await persistence.updateLoginAttempts(u, 0, false)

    let code = Math.floor(100000 + Math.random() * 900000).toString()
    let expiry = new Date(Date.now() + 1000 * 60 * 3) // 3 minutes

    await persistence.store2FACode(u, code, expiry)
    await emailSystem.send2FACode(details.email, code)

    return { status: 'pending_2fa', username: u }
}


async function verify2FA(u, enteredCode){
    let record = await persistence.get2FACode(u)
    if(!record) return {error: 'No Pending 2FA found'}
    if(new Date() > record.expiry){
        await persistence.delete2FACode(u)
        return {error : 'Code expired'}
    }
    if (record.code !== enteredCode) return {error : 'Invalid code'}

    await persistence.delete2FACode(u)

    let sessionKey = crypto.randomUUID()
    let sd = {
        key: sessionKey,
        expiry: new Date(Date.now() + 1000*60*5),
        data: {
            username: u
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

/**
 * Retrieves all document records associated with a specific employee from the database.
 * * @async
 * @param {string} empId - The unique identifier of the employee.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of document objects.
 */
async function getDocumentsByEmployee(empId) {
    return persistence.getDocumentsByEmployee(empId)
}


/**
 * Saves a new document record metadata into the documents collection.
 * * @async
 * @param {Object} doc - The document record object.
 * @param {string} doc.empId - ID of the employee the document belongs to.
 * @param {string} doc.filename - The unique generated filename stored on the filesystem.
 * @param {string} doc.originalname - The original name of the file uploaded by the user.
 * @param {Date} doc.uploadedAt - The timestamp when the document was saved.
 * @returns {Promise<Object>} A promise that resolves to the result of the insert operation.
 */
async function saveDocumentRecord(doc) {
    return persistence.saveDocumentRecord(doc)
}

/**
 * Retrieves a single document record by its unique system-generated filename.
 * * @async
 * @param {string} name - The unique filename to search for.
 * @returns {Promise<Object|null>} A promise that resolves to the document object if found, or null.
 */
async function getDocumentByFilename(name) {
    return persistence.getDocumentByFilename(name)
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
    logAccess,
    verify2FA,
    getDocumentsByEmployee,
    saveDocumentRecord,
    getDocumentByFilename

}