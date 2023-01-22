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
        (folders) => res.json(folders),
        (err) => {
            res.json(`There was an issue retrieving your folders`);
            console.log(err);
        }
    );
});

app.post('/folders/:name', (req, res) => {
    const folder = new Folder({name: req.params.name});
    folder.save((err) => {
        if (err) {
            if (err.code === 11000) {
                res.send(`There is already a folder named ${req.params.name}`)
                console.log(`There is already a folder named ${req.params.name}`);
            } else {
                res.send(err.message);
                console.log(err.message);
            }
        } else {
            res.send(`Successfuly saved new folder' ${folder.name}'`);
        };
    });

});

app.delete('/folders', (req, res) => {
    Folder.deleteMany({}).exec().then(
        (folders) => {
            res.send('Successfully deleted all folders');
            console.log(folders);
        },
        (err) => {
            res.send('There was a problem deleting your folders');
            console.log(err);
        }
    );
});

app.delete('/folders/:name', (req, res) => {
    Folder.deleteOne({name: req.params.name}).exec().then(
        (folder) => {
        console.log(folder);
        res.send(`Successfully deleted '${req.params.name}'`);
        }, 
        (err) => {
            console.log(err);
            res.send(`You were unsuccessful in deleting the folder '${req.params.name}'`);
        }
    );
});

app.listen(3000, () => console.log('listening'));
