const business = require("./Business")
const prompt = require("prompt-sync")()

const express = require('express')
const {engine} = require('express-handlebars')
app = express()
app.use(express.urlencoded({ extended: true }));

app.set('views',__dirname+"/templates")
app.set('view engine','handlebars')
app.engine('handlebars',engine())

app.listen(8000,()=>{
    console.log('server is up')
})


/**
 * Renders the home page with a list of all employees.
 * @route GET /
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
app.get('/', async (req, res) => {
    let data = await business.getAllEmployees()

    res.render('home',{employees : data})
})


/**
 * GET /employee/:id
 * Fetches details and shifts for a specific employee, checks shift timing, and renders the profile.
 * @param {string} id - The employee ID from the URL parameters.
 */
app.get('/employee/:id',async(req,res)=>{
    let eid = req.params.id
    let emp = await business.findEmployee(eid)
    let empShifts = await business.getEmployeeShifts(eid)
    
    business.isMorning(empShifts)

    res.render('employee',{employee : emp, shifts : empShifts})
})


/**
 * GET /edit-details/:id
 * Fetches a specific employee's data to prepopulate the edit form.
 * @param {string} id - The employee ID from the URL parameters.
 */
app.get('/edit-details/:id',async(req,res)=>{
    let eid = req.params.id
    let emp = await business.findEmployee(eid)
    res.render('edit',{employee : emp })
})


/**
 * POST /edit-details/:id
 * Validates the updated name and phone format before saving changes to the database.
 * @param {string} id - The employee ID from the URL parameters.
 */
app.post('/edit-details/:id', async(req,res)=>{
    let newName = req.body.name.trim()
    let newPhone = req.body.phone.trim()
    let eid = req.params.id

    
    if (!newName) {
        return res.send("Name must be non-empty"); 
    }

    const phoneRegex = /^\d{4}-\d{4}$/;
    if (!phoneRegex.test(newPhone)) {
        return res.send("Phone number must be in the format 0000-0000");
    }

    await business.updateDetails(eid,newName,newPhone)

    res.redirect('/confirmation')
})


/**
 * GET /confirmation
 * Displays a simple success message after a successful data update.
 */
app.get('/confirmation',(req,res)=>{
    res.send(`<h1>Details Saved</h1>
        <a href="/">Back</a>`)
})