const business = require("./Business")
const prompt = require("prompt-sync")()

const express = require('express')
app = express()

app.listen(8000,()=>{
    console.log('server is up')
})

app.get('/',async(req,res)=>{
    let result = `<h1>List of Employees</h1>`
    let data =await business.getAllEmployees()

    for(let x of data){
        result +=`<ul>
            <li><a href="#">${x.name}</a></li>
        </ul`
    }
    res.send(result)
        
})