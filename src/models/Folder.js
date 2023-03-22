const { Schema, model } = require('mongoose')

const noteSchema = new Schema({
    name: {
        type: String
    },
    body: {
        type: String,
        default: ''
    }
})

const folderSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    notes: {
        type: [noteSchema],
        default: []
    }
})

module.exports = new model('Folder', folderSchema)