const fs = require("fs/promises")
const prompt = require("prompt-sync")

/////////////Reading Data//////////////////
async function readEmployeeData(){
    let rawData = await fs.readFile('employees.json')
    let result = JSON.parse(rawData)
    return result
}
async function readShiftData(){
    let raw = await fs.readFile('shifts.json')
    let result = JSON.parse(raw)
    return result;
}
async function readAssignmentsData(){
    let raw = await fs.readFile('assignments.json')
    let result = JSON.parse(raw)
    return result;
}
////////////////////////////////////////////////


//crud
async function getAllEmployees() {
    result = await readEmployeeData();
    return result
}

async function findEmployee(empId) {
    employeeList = await getAllEmployees()
    for (let emp of employeeList) {
        if (emp.employeeId === empId) {
            return emp
        }
    }
    return undefined
}
async function findShift(shiftId) {
    shiftList = await readShiftData();
    for (let shift of shiftList) {
        if (shift.shiftId == shiftId) {
            return shift
        }
    }
    return undefined
}

//crud
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

async function findAssignment(empId, shiftId) {
    
    assignmentList = await readAssignmentsData()
    for (let asn of assignmentList) {
        if (asn.employeeId === empId && asn.shiftId === shiftId) {
            return asn
        }
    }
    return undefined
}

async function addAssignment(empId, shiftId) {
    
    assignmentList = await readAssignmentsData()
    assignmentList.push({employeeId: empId, shiftId: shiftId})
    await fs.writeFile('assignments.json', JSON.stringify(assignmentList, null, 4))
}

//crud
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


//crud
async function assignShift(empId, shiftId) {
    // check that empId exists
    let employee = await findEmployee(empId)
    if (!employee) {
        return "Employee does not exist"
    }
    // check that shiftId exists
    let shift = await findShift(shiftId)
    if (!shift) {
        return "Shift does not exist"
    }
    // check that empId,shiftId doesn't exist
    let assignment = await findAssignment(empId, shiftId)
    if (assignment) {
        return "Employee already assigned to shift"
    }
    // add empId,shiftId into the bridge
    await addAssignment(empId, shiftId)
    return "Ok"
}


module.exports = {
    getAllEmployees,
    getEmployeeShifts,
    addEmployeeRecord,
    assignShift
}