const business = require("./Business")
const prompt = require("prompt-sync")()

const express = require('express')
const {engine} = require('express-handlebars')
app = express()
app.use(express.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

app.set('views',__dirname+"/templates")
app.set('view engine','handlebars')
app.engine('handlebars',engine())

app.listen(8000,()=>{
    console.log('server is up')
})



//security log
app.use(async (req, res, next) => {
    
    if (req.method === 'POST' && req.url === '/login') {
        next()
        return
    }

    let sessionKey = req.cookies.session
    let username = undefined
    if (sessionKey) {
        let sd = await business.getSession(sessionKey)
        if (sd) {
            username = sd.data.username
        }
    }
    await business.logAccess({
        timestamp: new Date(),
        username: username,
        url: req.url,
        method: req.method
    })
    next()
})




app.get('/login', (req,res) => {
    let message = req.query.message

    res.render('login',{
        message : message || null
    })
})

app.post('/login', async (req, res) => {
    let username = req.body.username
    let password = req.body.password

    let session = await business.attemptLogin(username, password)
    
    
    await business.logAccess({
        timestamp: new Date(),
        username: username,
        url: '/login',
        method: 'POST'
    })

    if (session) {
        res.cookie('session', session.key, { expires: session.expiry })
        res.redirect('/')
    } else {
        res.redirect('/login?message=Invalid Credentials')
    }
})

app.get('/logout', async(req,res)=>{
    await business.terminateSession(req.cookies.session)
    res.clearCookie('session')
    res.redirect('/login')
})

//Middleware for authentication
async function authMiddleware(req, res, next) {
    let sessionKey = req.cookies.session
    if (!sessionKey) {
        res.redirect('/login')
        return
    }
    let sd = await business.getSession(sessionKey)
    if (!sd) {
        res.redirect('/login?message=You must be logged in to see that page')
        return
    }
    // Extend session by 5 minutes on every visit
    await business.extendSession(sessionKey)
    next()
}
app.use(['/','/employee/:id','/edit-details/:id','/confirmation'], authMiddleware)


//Protected routes


/**
 * Renders the home page with a list of all employees.
 * @route GET /
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
app.get('/', async (req, res) => {
    let data = await business.getAllEmployees()
    res.render('home', { employees: data })
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