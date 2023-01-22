const mongoose = require('mongoose');
require('dotenv').config();

const db_location = `mongodb+srv://boss-user:${process.env.DB_PASSWORD}\
@my-free-cluster.it1siet.mongodb.net/?retryWrites=true&w=majority`;
console.log(db_location)

module.exports = function () {
    const atlas_opts = { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    };
    mongoose.connect(db_location, atlas_opts);
};
