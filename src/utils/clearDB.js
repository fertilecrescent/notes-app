const mongoose = require('mongoose')
const Folder = require('../models/Folder.js')
const connectToDB = require('../utils/connectToDB.js')

mongoose.set('strictQuery', false)

connectToDB().then(() => {
    Folder.deleteMany({}).then(() => console.log('database has been cleared'))
})