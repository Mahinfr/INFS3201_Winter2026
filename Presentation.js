const business = require("./Business")
const prompt = require("prompt-sync")()

const express = require('express')
const {engine} = require('express-handlebars')
app = express()

app.set('views',__dirname+"/templates")
app.set('view engine','handlebars')
app.engine('handlebars',engine())

app.listen(8000,()=>{
    console.log('server is up')
})



app.get('/', async (req, res) => {
    let data = await business.getAllEmployees()

    res.render('home',{employees : data})
})

app.get('/employee/:id',async(req,res)=>{
    let eid = req.params.id
    let emp = await business.findEmployee(eid)
    let empShifts = await business.getEmployeeShifts(eid)
    
    console.log(empShifts)
    res.render('employee',{employee : emp, shifts : empShifts})
})

app.post('/edit-details/:id',async(req,res)=>{
    let eid = req.params.id
    res.render('edit',{})
})