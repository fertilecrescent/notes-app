const mongoose = require('mongoose');
const express = require('express');
const Folder = require('./models/Folder.js');
const connectToDB = require('./utils/connectToDB.js');

mongoose.set('strictQuery', false); // to avoid a warning and prepare for update
connectToDB();

const app = express();
app.use(express.static('frontend/public'));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/frontend/index.html`);
});

app.get('/folders', (req, res) => {
    Folder.find({}).exec().then(
        (folders) => {
            res.json(folders);
        },
        (err) => {
            console.log(err);
            res.status(500).send();
        }
    );
});

app.post('/folders/:name', (req, res) => {
    const folder = new Folder({name: req.params.name});
    folder.save((err) => {
        console.log(err);
        if (err) {
            if (err.code === 11000) {
                console.log(err);
                var message = `A folder named '${req.params.name}' already exists`
                res.status(400);
                res.send({'message': message});
            } else {
                console.log(err);
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
            console.log(err);
            res.status(500).send();
        }
    );
});

app.delete('/folders/:name', (req, res) => {
    Folder.deleteOne({name: req.params.name}).exec().then(
        (delete_data) => {
            res.status(200).send();
        }, 
        (err) => {
            console.log(err);
            res.status(500).send()
        }
    );
});

app.listen(3000, () => console.log('listening'));