const fs = require("fs/promises")
const prompt = require("prompt-sync")

const {MongoClient} = require('mongodb')
const client = new MongoClient('mongodb+srv://60307275:12class34@cluster0.atbir.mongodb.net/')

async function connection(){
    await client.connect()
}

/////////////Reading Data//////////////////
async function readEmployeeData(){
    let rawData = await fs.readFile('employees.json','utf-8')
    let result = JSON.parse(rawData)
    return result
}
async function readShiftData(){
    let raw = await fs.readFile('shifts.json','utf-8')
    let result = JSON.parse(raw)
    return result;
}
async function readAssignmentsData(){
    let raw = await fs.readFile('assignments.json','utf-8')
    let result = JSON.parse(raw)
    return result;
}

async function readConfig(){
    let raw =await fs.readFile('config.json','utf-8')
    let result = JSON.parse(raw)
    return result;
}
////////////////////////////////////////////////

/**
 * Return a list of all employees loaded from the storage.
 * @returns {Array<{ employeeId: string, name: string, phone: string }>} List of employees
 */
async function getAllEmployees() {
    await connection()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    let data = await employees.find().toArray()

    return data
}



/**
 * Find a single employee given their ID number.
 * @param {string} empId 
 * @returns {{ employeeId: string, name: string, phone: string }|undefined}
 */
async function findEmployee(empId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    let data = await employees.findOne({ employeeId: empId })
    return data
}

/**
 * Get a single shift given the shiftId
 * @param {string} shiftId 
 * @returns {{shiftId:string, date:string, startTime:string, endTime:string}|undefined}
 */
async function findShift(shiftId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('shifts')
    let data = await employees.find({shiftId: shiftId }).toArray()

    return data
}
/**
 * Get a list of shiftIDs for an employee.
 * @param {string} empId 
 * @returns {Array<{string}>}
 */

async function getEmployeeShifts(empId) {
    await connection()
    let db = client.db('infs3201_winter2026')
    let assignments = db.collection('assignments')
    let shifts = db.collection('shifts')

    // Step 1: Get assignments for this employee
    let employeeAssignments = await assignments.find({ employeeId: empId }).toArray()

    // Step 2: Manually extract shiftIds 
    let shiftIds = []
    for (let a of employeeAssignments) {
        shiftIds.push(a.shiftId)
    }

    if (shiftIds.length === 0) {
        return []
    }

    // Step 3: Get matching shifts using $in
    let shiftDetails = await shifts.find({ shiftId: { $in: shiftIds } }).toArray()
    return shiftDetails

}

/**
 * Find a shift object give the employeeId and the shiftId.
 * @param {string} empId 
 * @param {string} shiftId 
 * @returns {{employeeId:string, shiftId:string}|undefined}
 */

async function findAssignment(empId, shiftId) {
    
    await connection()

    const db = client.db('infs3201_winter2026')
    const assignments = db.collection('assignments')

    const result = await assignments.findOne({
        employeeId: empId,
        shiftId: shiftId
    })
    
    return result   
}


/**
 * Add a new employee record to the system. The empId is automatically generated based
 * on the next available ID number from what is already in the file.
 * @param {{name:string, phone:string}} emp 
 */
async function addEmployeeRecord(emp) {
    await connection()

    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')

    let employeeList = await employees.find().toArray()

    let maxId = 0

    for (let e of employeeList) {
        let eid = Number(e.employeeId.slice(1))
        if (eid > maxId) {
            maxId = eid
        }
    }

    emp.employeeId = `E${String(maxId + 1).padStart(3, '0')}`

    await employees.insertOne(emp)
}


module.exports = {
    findAssignment,
    findEmployee,
    findShift,
    getAllEmployees,
    getEmployeeShifts,
    addEmployeeRecord,
    readConfig,
    readShiftData,
}