const mongoose = require('mongoose');
require('dotenv').config();
const Folder = require('./models/Folder.js');

mongoose.set('strictQuery', false);

const db_location = `mongodb+srv://boss-user:${process.env.DB_PASSWORD}
@my-free-cluster.it1siet.mongodb.net/?retryWrites=true&w=majority`;
const atlas_opts = { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
};

const general = new Folder({name: 'general'});
const daily_feelings = new Folder({name: 'daily feelings'});
const todo = new Folder({name: 'todo'});
const lyrics = new Folder({name: 'lyrics'});

mongoose.connect(db_location, atlas_opts);