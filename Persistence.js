const { MongoClient, ObjectId } = require('mongodb')
const client = new MongoClient('mongodb://mahin1738_db_user:12class34@ac-jj6qkc8-shard-00-00.ivspu6f.mongodb.net:27017,ac-jj6qkc8-shard-00-01.ivspu6f.mongodb.net:27017,ac-jj6qkc8-shard-00-02.ivspu6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-ggfa4e-shard-0&authSource=admin&appName=Cluster0')

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
    let data = await shifts.find({ assignedEmployees: new ObjectId(empId) }).toArray()
    
    
    return data
}

getEmployeeShifts('69d95f585ee1a4258370ec36')
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


//////////Assignmet 5 functions

/**
 * Updates the failed login attempt count and locked status for a user.
 * @param {string} username
 * @param {number} attempts
 * @param {boolean} locked
 * @returns {Promise<void>}
 */
async function updateLoginAttempts(username, attempts, locked) {
  await connection()
  let db = client.db('infs3201_winter2026')
  let users = db.collection('users')
  await users.updateOne(
    { username },
    { $set: { failedAttempts: attempts, locked } }
  )
}

/**
 * Stores a pending 2FA code with expiry for a username.
 * @param {string} username
 * @param {string} code
 * @param {Date} expiry
 * @returns {Promise<void>}
 */
async function store2FACode(username, code, expiry) {
  await connection()
  let db = client.db('infs3201_winter2026')
  let pending = db.collection('pending_2fa')
  // Upsert so there's only one pending code per user at a time
  await pending.updateOne(
    { username },
    { $set: { username, code, expiry } },
    { upsert: true }
  )
}

/**
 * Retrieves the pending 2FA record for a username.
 * @param {string} username
 * @returns {Promise<{ username: string, code: string, expiry: Date }|null>}
 */
async function get2FACode(username) {
  await connection()
  let db = client.db('infs3201_winter2026')
  let pending = db.collection('pending_2fa')
  return await pending.findOne({ username })
}

/**
 * Deletes the pending 2FA record for a username.
 * @param {string} username
 * @returns {Promise<void>}
 */
async function delete2FACode(username) {
  await connection()
  let db = client.db('infs3201_winter2026')
  let pending = db.collection('pending_2fa')
  await pending.deleteOne({ username })
}


/**
 * Retrieves all document records associated with a specific employee from the database.
 * * @async
 * @param {string} empId - The unique identifier of the employee.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of document objects.
 */
async function getDocumentsByEmployee(empId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    return await db.collection('documents')
        .find({ empId: empId })
        .toArray()
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
    await connection()
    let db = client.db('infs3201_winter2026')
    return await db.collection('documents').insertOne(doc)
}

/**
 * Retrieves a single document record by its unique system-generated filename.
 * * @async
 * @param {string} name - The unique filename to search for.
 * @returns {Promise<Object|null>} A promise that resolves to the document object if found, or null.
 */
async function getDocumentByFilename(name) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let documents = db.collection('documents')

    let doc = await documents.findOne({ filename: name })
    return doc
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
    logAccess,
    updateLoginAttempts,
    store2FACode,
    get2FACode,
    delete2FACode,
    getDocumentsByEmployee,
    saveDocumentRecord,
    getDocumentByFilename
}