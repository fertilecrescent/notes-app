const mongoose = require('mongoose');
const express = require('express');
const Folder = require('./models/Folder.js');
const connectToDB = require('./utils/connectToDB.js');
const { response } = require('express');

mongoose.set('strictQuery', false); // to avoid a warning and prepare for update
connectToDB();

const app = express();
app.use(express.static(`${__dirname}/frontend/public`));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/frontend/index.html`);
});

app.get('/all-data', (req, res) => {
    Folder.find({}).then(
        (folders) => {
            res.json(folders);
        }, 
        (err) => {
            res.status(500).send();
        }
    )
});

app.get('/folders', (req, res) => {
    Folder.find({}).then(
        (folders) => {
            res.json(folders.map(folder => folder.name));
        },
        (err) => {
            res.status(500).send();
        }
    );
});

app.post('/folders/:folder_name', (req, res) => {
    const folder = new Folder({name: req.params.folder_name});
    folder.save((err) => {
        if (err) {
            if (err.code === 11000) {
                var message = `A folder named '${req.params.folder_name}' already exists`
                res.status(400);
                res.send({'message': message});
            } else {
                res.status(500).send();
            }
        } else {
            res.status(200).send();
        }
    })
});

app.delete('/folders', (req, res) => {
    Folder.deleteMany({}).then(
        undefined,
        (err) => {
            res.status(500).send();
        }
    );
});

app.delete('/folders/:folder_name', (req, res) => {
    Folder.deleteOne({name: req.params.folder_name}).then(
        (dbResult) => {
            res.status(200).send();
        }, 
        (err) => {
            res.status(500).send()
        }
    );
});

app.get('/folders/:folder_name', (req, res) => {
    // TODO: set the result argument of other query arguments to literally be 'result' as to stay consistent
    Folder.findOne({name: req.params.folder_name}).then(
        (dbResult) => {
            res.json(dbResult.notes.map((note) => note.name));
        },
        (err) => {
            res.status(500).send();
        }
    );
});

app.post('/folders/:folder_name/:note_name', (req, res) => {
    Folder.updateOne(
        {name: req.params.folder_name,
        notes: {$not: {$elemMatch: {name: req.params.note_name}}}}, // should be unique
        {$push: {notes: {name: req.params.note_name}}},
        (err, dbResult) => {
            if (err) {
                res.status(500).send();
            } else {
                if (dbResult.matchedCount === 0) {
                    res.status(400).send({message: `Either '${req.params.folder_name}' was not found or `
                    + `a note named '${req.params.note_name}' already exists under '${req.params.folder_name}.'`});
                } else {
                    res.status(200).send();
                }
            };
        }
    );
});

app.delete('/folders/:folder_name/:note_name', (req, res) => {
    Folder.updateOne(
        {name: req.params.folder_name},
        {$pull: {notes: {name: req.params.note_name}}},
        (err, dbResult) => {
            if (err) {res.status(500).send();}
            else {res.status(200).send();}
        }
    )
});

app.listen(3000, () => console.log('listening'));