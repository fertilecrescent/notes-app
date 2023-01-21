const { Schema, Model } = require('mongoose');

const folderSchema = new Schema({
    name: {
        type: String,
        required: true
    }
});

module.exports = new Model('Folder', folderSchema);