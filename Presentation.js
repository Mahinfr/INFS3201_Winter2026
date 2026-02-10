const business = require("./Business")
const prompt = require("prompt-sync")()

async function displayEmployees() {
    let employees = await business.getAllEmployees()
    console.log('Employee ID  Name                Phone')
    console.log('-----------  ------------------- ---------')
    for (let emp of employees) {
        console.log(`${emp.employeeId.padEnd(13)}${emp.name.padEnd(20)}${emp.phone}`)
    }
}

async function addNewEmployee() {
    let name = prompt('Enter employee name: ')
    let phone = prompt('Enter phone number: ')
    await business.addEmployeeRecord({
        name: name,
        phone: phone
    })
    console.log('Employee added...')
}

async function scheduleEmployee() {
    let empId = prompt('Enter employee ID: ')
    let shiftId = prompt(' Enter shift ID: ')
    let result = await business.assignShift(empId, shiftId)
    if (result === 'Ok') {
        console.log("Shift Recorded")
    }
    else {
        console.log(result)
    }
}

async function getEmployeeSchedule() {
    let empId = prompt('Enter employee ID: ')
    let details = await business.getEmployeeShifts(empId)
    console.log('\n')
    console.log('date,start,end')
    for (let d of details) {
        console.log(`${d.date},${d.startTime},${d.endTime}`)
    }
}



async function displayMenu() {
    while (true) {
        console.log('1. Show all employees')
        console.log('2. Add new employee')
        console.log('3. Assign employee to shift')
        console.log('4. View employee schedule')
        console.log('5. Exit')
        let choice = Number(prompt("What is your choice> "))
        if (choice === 1) {
            await displayEmployees()
            console.log('\n\n')
        }
        else if (choice == 2) {
            await addNewEmployee()
            console.log('\n\n')
        }
        else if (choice == 3) {
            await scheduleEmployee()
            console.log('\n\n')
        }
        else if (choice == 4) {
            await getEmployeeSchedule()
            console.log('\n\n')
        }
        else if (choice == 5) {
            break
        }
        else {
            console.log("Error in selection")
        }
    }
    console.log('*** Goodbye!')
}

displayMenu()