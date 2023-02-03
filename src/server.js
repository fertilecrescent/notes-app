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

app.post('/:folder', (req, res) => {
    const folder = new Folder({name: req.params.folder});
    folder.save((err) => {
        if (err) {
            if (err.code === 11000) {
                var message = `A folder named '${req.params.folder}' already exists`
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

app.delete('/', (req, res) => {
    Folder.deleteMany({}).then(
        undefined,
        (err) => {
            res.status(500).send();
        }
    );
});

app.delete('/:folder', (req, res) => {
    Folder.deleteOne({name: req.params.folder}).then(
        (dbResult) => {
            res.status(200).send();
        }, 
        (err) => {
            res.status(500).send()
        }
    );
});

app.get('/:folder', (req, res) => {
    // TODO: set the result argument of other query arguments to literally be 'result' as to stay consistent
    Folder.findOne({name: req.params.folder}).then(
        (dbResult) => {
            console.log(dbResult.notes.map((note) => {return {'name': note.name, 'body': note.body}}))
            res.json(dbResult.notes.map((note) => {
                return {'name': note.name, 'body': note.body}
            }));
        },
        (err) => {
            res.status(500).send();
        }
    );
});

app.post('/:folder/:note', (req, res) => {
    Folder.updateOne(
        {name: req.params.folder,
        notes: {$not: {$elemMatch: {name: req.params.note}}}}, // should be unique
        {$push: {notes: {name: req.params.note}}},
        (err, dbResult) => {
            if (err) {
                res.status(500).send();
            } else {
                if (dbResult.matchedCount === 0) {
                    res.status(400).send({message: `Either '${req.params.folder}' was not found or `
                    + `a note named '${req.params.note}' already exists under '${req.params.folder}.'`});
                } else {
                    res.status(200).send();
                }
            };
        }
    );
});

app.put('/:folder/:note', (req, res) => {
    console.log('yeasefawfe')
    console.log(req.query.body)
    Folder.updateOne(
        {name: req.params.folder, 'notes.name': req.params.note},
        {$set: {'notes.$.body': req.query.body}},
        (err, dbResult) => {
            if (dbResult) {
                console.log(dbResult, )
                if (dbResult.matchedCount === 1) {
                    res.status(200).send();
                } else {
                    res.status(400).send({message: `There is no folder name ${req.params.folder} ` + 
                    `with a note named ${req.params.note}. Please try again.`})
                }
            }
            else {
                console.log('yes')
                console.log(err);
                res.status(500).send();
            }
        }
    );
});

app.delete('/:folder/:note', (req, res) => {
    Folder.updateOne(
        {name: req.params.folder},
        {$pull: {notes: {name: req.params.note}}},
        (err, dbResult) => {
            if (err) {res.status(500).send();}
            else {res.status(200).send();}
        }
    )
});

app.listen(3000, () => console.log('listening'));