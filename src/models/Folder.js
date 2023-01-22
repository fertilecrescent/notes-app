const { Schema, model } = require('mongoose');

const folderSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = new model('Folder', folderSchema);