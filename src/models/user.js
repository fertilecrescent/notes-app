// -- USERS HAVEN'T BEEN IMPLEMENTED YET --


// const mongoose = require('mongoose')

// const userSchema = mongoose.Schema({
//     name: String,
//     username: String,
//     passwordHash: String,
//     folders: [
//         {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Folder'
//         }
//     ]
// })

// userSchema.set('toJSON', {
//     transform: (doc, obj) => {
//         obj.id = doc._id.toString()
//         delete obj._id
//         delete obj.__v
//         delete obj.passwordHash
//     }
// })

// userSchema.pre('deleteOne', (next) => {
//     Folder.deleteMany({id: {$in: this.folders}}).then((_, err) => {
//         if (err) { next(err) }
//         else { next() }
//     })
// })

// const User = mongoose.model('User', userSchema)
// module.exports = User