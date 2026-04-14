const business = require("./Business")
const prompt = require("prompt-sync")()

const fileUpload = require('express-fileupload')
const path = require('path')
const fs = require('fs')


const express = require('express')
const {engine} = require('express-handlebars')
app = express()
app.use(express.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

app.use(fileUpload())

const UPLOADS_DIR = path.join(__dirname, 'private_uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR)

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

    await business.logAccess({
        timestamp: new Date(),
        username: username,
        url: '/login',
        method: 'POST'
    })

    let result = await business.attemptLogin(username, password) //

    if (result.status === 'locked') {
        return res.redirect('/login?message=Account locked')
    }
    if (result.status === 'invalid') {
        return res.redirect('/login?message=Invalid Credentials')
    }
    // pending_2fa — store username in a temp cookie (not a real session yet)
    res.cookie('pending_user', result.username, { maxAge: 1000 * 60 * 3 })
    res.redirect('/2fa')
})

    
app.get('/2fa', (req, res) => {
  if (!req.cookies.pending_user) return res.redirect('/login')
  res.render('2fa', { message: req.query.message || null })
})

app.post('/2fa', async (req, res) => {
  let username = req.cookies.pending_user
  if (!username) return res.redirect('/login')

  let code = req.body.code.trim()
  let result = await business.verify2FA(username, code)

  if (result.error) {
    return res.redirect('/2fa?message=' + encodeURIComponent(result.error))
  }

  res.clearCookie('pending_user')
  res.cookie('session', result.key, { expires: result.expiry })
  res.redirect('/')
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

    let docs = await business.getDocumentsByEmployee(eid) 
    
    business.isMorning(empShifts)

    res.render('employee',{employee : emp, shifts : empShifts, documents : docs})
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



app.post('/employee/:id/documents', authMiddleware, async (req, res) => {
    let eid = req.params.id

    // No file attached
    if (!req.files || !req.files.document) {
        return res.send('No file uploaded')
    }

    let uploadedFile = req.files.document

    // PDF only check
    if (uploadedFile.mimetype !== 'application/pdf') {
        return res.send('Only PDF files are allowed')
    }

    // 2MB size check
    if (uploadedFile.size > 2 * 1024 * 1024) {
        return res.send('File must be under 2MB')
    }

    // Check 5 document limit
    let existing = await business.getDocumentsByEmployee(eid)
    if (existing.length >= 5) {
        return res.send('Maximum of 5 documents allowed per employee')
    }

    // Build a unique filename using timestamp to avoid overwrites
    let timestamp = Date.now()
    let uniqueFilename = timestamp + '_' + uploadedFile.name

    let savePath = path.join(UPLOADS_DIR, uniqueFilename)

    // Move from temp to permanent location
    await uploadedFile.mv(savePath)

    await business.saveDocumentRecord({
        empId: eid,
        filename: uniqueFilename,
        originalname: uploadedFile.name,
        uploadedAt: new Date()
    })

    res.redirect(`/employee/${eid}`)
})


// Protected — NOT a static route, login required
app.get('/documents/:filename', authMiddleware, async (req, res) => {
    let doc = await business.getDocumentByFilename(req.params.filename)
    if (!doc) return res.status(404).send('Not found')

    let filePath = path.join(UPLOADS_DIR, req.params.filename)
    if (!fs.existsSync(filePath)) return res.status(404).send('File missing')

    res.setHeader('Content-Type', 'application/pdf')
    res.sendFile(filePath)
})