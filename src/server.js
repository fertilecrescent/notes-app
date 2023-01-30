const mongoose = require('mongoose');
const express = require('express');
const Folder = require('./models/Folder.js');
const connectToDB = require('./utils/connectToDB.js');

mongoose.set('strictQuery', false); // to avoid a warning and prepare for update
connectToDB();

const app = express();
app.use(express.static(`${__dirname}/frontend/public`));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/frontend/index.html`);
});

app.get('/folders', (req, res) => {
    Folder.find({}).exec().then(
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
                var message = `A folder named '${req.params.name}' already exists`
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
    Folder.deleteMany({}).exec().then(
        undefined,
        (err) => {
            res.status(500).send();
        }
    );
});

app.delete('/folders/:folder_name', (req, res) => {
    Folder.deleteOne({name: req.params.folder_name}).exec().then(
        (result) => {
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
        (result) => {
            res.json(result.notes.map((note) => note.name));
        },
        (err) => {
            res.status(500).send();
        }
    );
});

app.post('/folders/:folder_name/:note_name', (req, res) => {
    Folder.updateOne(
        {name: req.params.folder_name,
        notes: {$not: {$elemMatch: {name: req.params.note_name}}}
        },
        {$push: {notes: {name: req.params.note_name}}},
        (err, result) => {
            console.log(err, 'err');
            console.log(result, 'result');
            if (err) {
                res.status(500).send();
            } else {
                res.status(200).send();
            };
        }
    );
});

app.delete('/folders/:folder_name/:note_name', (req, res) => {
    Folder.updateOne(
        {name: req.params.folder_name},
        {$pull: {notes: {name: req.params.note_name}}},
        (err, updateRes) => {
            if (err) {res.status(500).send();}
            else {res.status.send(200);}
        }
    )
});

app.listen(3000, () => console.log('listening'));