const { MongoClient, ObjectId } = require('mongodb')
const client = new MongoClient('mongodb+srv://60307275:12class34@cluster0.atbir.mongodb.net/')

async function connection(){
    await client.connect()
}

/**
 * Return a list of all employees loaded from the database.
 * @returns {Promise<Array<{ _id: ObjectId, name: string, phone: string }>>}
 */
async function getAllEmployees() {
    await connection()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    let data = await employees.find().toArray()
    return data
}

/**
 * Find a single employee given their MongoDB ObjectId.
 * @param {string} empId - The string representation of the employee's ObjectId
 * @returns {Promise<{ _id: ObjectId, name: string, phone: string }|null>}
 */
async function findEmployee(empId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    let data = await employees.findOne({ _id: new ObjectId(empId) })
    return data
}

/**
 * Find a single shift given its MongoDB ObjectId.
 * @param {string} shiftId - The string representation of the shift's ObjectId
 * @returns {Promise<{ _id: ObjectId, date: string, startTime: string, endTime: string, employees: Array<ObjectId> }|null>}
 */
async function findShift(shiftId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let shifts = db.collection('shifts')
    let data = await shifts.findOne({ _id: new ObjectId(shiftId) })
    return data
}



/**
 * Get all shifts that a given employee is assigned to by searching
 * the embedded employees array inside each shift document.
 * @param {string} empId - The string representation of the employee's ObjectId
 * @returns {Promise<Array<{ _id: ObjectId, date: string, startTime: string, endTime: string, employees: Array<ObjectId> }>>}
 */
async function getEmployeeShifts(empId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let shifts = db.collection('shifts')
    let data = await shifts.find({ employees: new ObjectId(empId) }).toArray()
    return data
}


/**
 * Find a shift object given the employee ObjectId and the shift ObjectId.
 * Used to check if an assignment already exists.
 * @param {string} empId - The string representation of the employee's ObjectId
 * @param {string} shiftId - The string representation of the shift's ObjectId
 * @returns {Promise<{ _id: ObjectId, date: string, startTime: string, endTime: string, employees: Array<ObjectId> }|null>}
 */
async function findAssignment(empId, shiftId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let shifts = db.collection('shifts')
    let result = await shifts.findOne({
        _id: new ObjectId(shiftId),
        employees: new ObjectId(empId)
    })
    return result
}


/**
 * Add a new employee record to the database.
 * No employeeId is generated - MongoDB assigns an ObjectId automatically.
 * @param {{ name: string, phone: string }} emp - Employee object without an id field
 * @returns {Promise<void>}
 */
async function addEmployeeRecord(emp) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    await employees.insertOne(emp)
}


/**
 * Updates an employee's name and phone number in the database.
 * Looks up the employee by their MongoDB ObjectId.
 * @param {string} empId - The string representation of the employee's ObjectId
 * @param {string} newName - The new name to assign to the employee
 * @param {string} newPhone - The new phone number to assign to the employee
 * @returns {Promise<void>}
 */
async function updateDetails(empId, newName, newPhone){
    await connection()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    await employees.updateOne(
        { _id: new ObjectId(empId) },
        { $set: { name: newName, phone: newPhone } }
    )
}



/**
 * Retrieves a user's details from the users collection by their username.
 * @param {string} username - The username to search for
 * @returns {Promise<{ _id: ObjectId, username: string, password: string }|null>}
 */
async function getUserDetails(username){
    await connection()
    let db = client.db('infs3201_winter2026')
    let users = db.collection('users')

    let result = await users.findOne({username : username})
    return result
}

/**
 * Inserts a new session document into the session collection.
 * @param {{ key: string, expiry: Date, data: { username: string } }} sd - The session object to store
 * @returns {Promise<void>}
 */
async function startSession(sd) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let session = db.collection('session')
    await session.insertOne(sd)
}

/**
 * Retrieves a session document from the session collection by its key.
 * @param {string} key - The unique session key to search for
 * @returns {Promise<{ key: string, expiry: Date, data: { username: string } }|null>}
 */
async function getSession(key) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let session = db.collection('session')
    let result = await session.findOne({key: key})
    return result
}

/**
 * Deletes a session document from the session collection by its key.
 * @param {string} key - The unique session key of the session to delete
 * @returns {Promise<void>}
 */
async function terminateSession(key){
    await connection()
    let db = client.db('infs3201_winter2026')
    let session = db.collection('session')
    await session.deleteOne({key:key})
}
/**
 * Extends the expiry of an existing session by 5 minutes from the current time.
 * Looks up the session by its key and updates the expiry field.
 * @param {string} sessionKey - The unique session key to extend
 * @returns {Promise<void>}
 */
async function extendSession(sessionKey) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let sessions = db.collection('sessions')
    await sessions.updateOne(
        { key: sessionKey },
        { $set: { expiry: new Date(Date.now() + 1000 * 60 * 5) } }
    )
}

/**
 * Inserts a new entry into the security_log collection.
 * @param {{ timestamp: Date, username: string|undefined, url: string, method: string }} entry
 * @returns {Promise<void>}
 */
async function logAccess(entry) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let log = db.collection('security_log')
    await log.insertOne(entry)
}



module.exports = {
    findAssignment,
    findEmployee,
    findShift,
    getAllEmployees,
    getEmployeeShifts,
    addEmployeeRecord,
    updateDetails,
    getUserDetails,
    startSession,
    getSession,
    terminateSession,
    extendSession,
    logAccess
}