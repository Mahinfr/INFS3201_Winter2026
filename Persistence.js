const fs = require("fs/promises")
const prompt = require("prompt-sync")

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
    result = await readEmployeeData();
    return result
}

/**
 * Find a single employee given their ID number.
 * @param {string} empId 
 * @returns {{ employeeId: string, name: string, phone: string }|undefined}
 */
async function findEmployee(empId) {
    employeeList = await getAllEmployees()
    for (let emp of employeeList) {
        if (emp.employeeId === empId) {
            return emp
        }
    }
    return undefined
}

/**
 * Get a single shift given the shiftId
 * @param {string} shiftId 
 * @returns {{shiftId:string, date:string, startTime:string, endTime:string}|undefined}
 */
async function findShift(shiftId) {
    shiftList = await readShiftData();
    for (let shift of shiftList) {
        if (shift.shiftId == shiftId) {
            return shift
        }
    }
    return undefined
}

/**
 * Get a list of shiftIDs for an employee.
 * @param {string} empId 
 * @returns {Array<{string}>}
 */

async function getEmployeeShifts(empId) {
    assignmentList = await readAssignmentsData()
    let shiftIds = []
    for (let asn of assignmentList) {
        if (asn.employeeId == empId) {
            shiftIds.push(asn.shiftId)
        }
    }

    shiftList =await readShiftData()

    let shiftDetails = []
    for (let sh of shiftList) {
        if (shiftIds.includes(sh.shiftId)) {
            shiftDetails.push(sh)
        }
    }

    return shiftDetails
}

/**
 * Find a shift object give the employeeId and the shiftId.
 * @param {string} empId 
 * @param {string} shiftId 
 * @returns {{employeeId:string, shiftId:string}|undefined}
 */

async function findAssignment(empId, shiftId) {
    
    assignmentList = await readAssignmentsData()
    for (let asn of assignmentList) {
        if (asn.employeeId === empId && asn.shiftId === shiftId) {
            return asn
        }
    }
    return undefined
}

/**
 * Record a new assignment of an employee to a shift. This functions does not
 * check for existing combinations so it is possible to double book an employee,
 * use assignShift instead to check for this.
 * @param {string} empId 
 * @param {string} shiftId 
 */
async function addAssignment(empId, shiftId) {
    
    assignmentList = await readAssignmentsData()
    assignmentList.push({employeeId: empId, shiftId: shiftId})
    await fs.writeFile('assignments.json', JSON.stringify(assignmentList, null, 4))
}

/**
 * Add a new employee record to the system. The empId is automatically generated based
 * on the next available ID number from what is already in the file.
 * @param {{name:string, phone:string}} emp 
 */
async function addEmployeeRecord(emp) {
    let maxId = 0
    
    let employeeList = await readEmployeeData()
    for (let e of employeeList) {
        let eid = Number(e.employeeId.slice(1))
        if (eid > maxId) {
            maxId = eid
        }
    }
    emp.employeeId = `E${String(maxId+1).padStart(3,'0')}`
    employeeList.push(emp)
    await fs.writeFile('employees.json', JSON.stringify(employeeList, null, 4))
}


///////////function made using LLM///////////

/**
 * Computes the duration of a work shift in hours.
 *
 * This function takes a start time and end time (formatted as "HH:mm"),
 * converts them into Date objects, and calculates the difference in hours.
 * It also handles overnight shifts where the end time is past midnight.
 *
 * @param {string} startTime - The shift start time in "HH:mm" format (e.g., "09:00").
 * @param {string} endTime - The shift end time in "HH:mm" format (e.g., "17:30").
 * @returns {number} The duration of the shift in hours (can be fractional, e.g., 2.5).
 *
 * @example
 * computeShiftDuration("11:00", "13:30"); // returns 2.5
 * computeShiftDuration("22:00", "02:00"); // returns 4
 */

function computeShiftDuration(startTime, endTime) {
    // Parse times into Date objects (using today's date as a placeholder)
    let start = new Date(`1970-01-01T${startTime}:00`);
    let end = new Date(`1970-01-01T${endTime}:00`);

    // Handle overnight shifts (end time past midnight)
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }

    // Difference in milliseconds → convert to hours
    let diffMs = end - start;
    let diffHours = diffMs / (1000 * 60 * 60);

    return diffHours;
}
////////////////////////////////////////////////////







module.exports = {
    findAssignment,
    findEmployee,
    findShift,
    getAllEmployees,
    getEmployeeShifts,
    addEmployeeRecord,
    computeShiftDuration,
    readConfig,
    readShiftData,
    addAssignment
}