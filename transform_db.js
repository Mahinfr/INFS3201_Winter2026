const { MongoClient, ObjectId } = require('mongodb')

const client = new MongoClient('mongodb+srv://60307275:12class34@cluster0.atbir.mongodb.net/')
const db = client.db('infs3201_winter2026') 

/**
 * Step 1 - Adds an empty employees array to every document in the shifts collection.
 * This prepares the shifts collection to receive embedded employee ObjectIds in Step 2.
 * Does not modify any other fields.
 * @returns {Promise<void>}
 */
async function addEmptyEmployeeArrays() {
    const shifts = db.collection('shifts')
    await shifts.updateMany({}, { $set: { employees: [] } })
    console.log('empty employees arrays added to all shifts')
}

/**
 * Step 2 - Iterates through all documents in the assignments collection and embeds
 * each employee's ObjectId into the corresponding shift's employees array.
 * Matches assignments using the legacy employeeId and shiftId string fields.
 * Logs a warning and skips if either the employee or shift cannot be found.
 * @returns {Promise<void>}
 */
async function embedEmployeesIntoShifts() {
    const assignments = db.collection('assignments')
    const employees = db.collection('employees')
    const shifts = db.collection('shifts')

    const allAssignments = await assignments.find({}).toArray()

    for (let i = 0; i < allAssignments.length; i++) {
        const assignment = allAssignments[i]

        // Find  the employee matching the old employeeId 
        const employee = await employees.findOne({ employeeId: assignment.employeeId })
        if (!employee) {
            console.log('Employee not found for:', assignment.employeeId)
            continue
        }

        // Find the shift  matching the old shiftId 
        const shift = await shifts.findOne({ shiftId: assignment.shiftId })
        if (!shift) {
            console.log('Shift not found for:', assignment.shiftId)
            continue
        }

        // Push the employee's ObjectId into the shift's employees array
        await shifts.updateOne(
            { _id: shift._id },
            { $push: { employees: employee._id } }
        )

        console.log(`Linked employee ${assignment.employeeId} -> shift ${assignment.shiftId}`)
    }

    console.log('employees embedded into shifts')
}

/**
 * Removes old employeeId and shiftId fields from their respective collections
 * and drops the assignments collection entirely.
 * After this operation, all documents are identified solely by their MongoDB _id (ObjectId).
 * @returns {Promise<void>}
 */
async function cleanUp() {
    const employees = db.collection('employees')
    const shifts = db.collection('shifts')

    // Remove employeeId field from all employees
    await employees.updateMany({}, { $unset: { employeeId: "" } })

    // Remove shiftId field from all shifts
    await shifts.updateMany({}, { $unset: { shiftId: "" } })

    // Drop the assignments collection entirely
    await db.collection('assignments').drop()

    console.log('Step 3 done: cleanup complete')
}

/**
 * Runs all transformation steps in order to migrate the database
 * from the Assignment 3 schema to the Assignment 4 schema.
 * Connects to the database, runs each step sequentially, then closes the connection.
 * If any step fails, the error is logged and the connection is closed safely.
 * @returns {Promise<void>}
 */
async function runTransformation() {
    try {
        await client.connect()
        console.log('Connected to MongoDB')

        await addEmptyEmployeeArrays()
        await embedEmployeesIntoShifts()
        await cleanUp()

        console.log('Transformation complete!')
    } catch (err) {
        console.error('Error during transformation:', err)
    } finally {
        await client.close()
    }
}

runTransformation()