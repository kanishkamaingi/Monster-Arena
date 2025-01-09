const mongoose = require('mongoose');
let Schema = mongoose.Schema;
require('dotenv').config();
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginHistory: [
        {
            dateTime: {
                type: Date,
                required: true
            },
            userAgent: {
                type: String,
                required: true
            }
        }
    ]
});



let User;

function initialize() {
    return new Promise(function (resolve, reject) {
        const db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err) => {
            reject(err); // Reject the promise with the error
        });

        db.once('open', () => {

            User = db.model('users', userSchema);
            resolve();
        });
    });
}


function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        }

        // Encrypt the plain text: "myPassword123"
        bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
        userData.password = hash
        const newUser = new User(
            userData
        );



       
        newUser.save()
            .then(() => resolve())
            .catch((err) => {
                if (err.code === 11000) {
                    reject("User Name already taken");
                } else {
                   
                    reject(`There was an error creating the user: ${err}`);
                }
            });
        })
        .catch((err) => {
            reject('There was an error encrypting the password')
        });

        // Create a new User instance
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
            .then((users) => {
                if (users.length === 0) {
                    reject(`Unable to find user: ${userData.userName}`)
                }
                
                bcrypt.compare( userData.password, users[0].password)
                .then((result) =>{

                    if (result ==  true) {
                        if (users[0].loginHistory.length == 8) {
                            users[0].loginHistory.pop()
                        }
                        users[0].loginHistory.unshift({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                        
                        User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                            .exec()
                            .then(() => {
                               resolve(users[0]);
                            })
                            .catch((err) => {
                                reject(`There was an error verrifying the user: ${err}`)
                            });
                    }
                    else{
                        console.log(result)
                        reject(`Incorrect Password for user ${userData.userName}`)
                    }
                
                })
                
            })
            .catch((err)=>{
                reject(`Unable to find user: ${userData.userName}`);
            })

    })
}

module.exports = {initialize, registerUser, checkUser};