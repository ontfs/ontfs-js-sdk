'use strict'

const express = require('express')
const path = require('path')
require('express-di')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const argv = require('yargs').argv
const api = require("../apis")


//解析body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

//允许跨域
app.use('/', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    next()
})


//打印错误
app.use(function (err, req, res, next) {
    console.error(err.stack)
    next(err)
})

console.log('rpc', argv.rpc)


const http = require('http');

let PORT = 8081
http.createServer(app).listen(PORT);