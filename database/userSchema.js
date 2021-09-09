const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-beautiful-unique-validation');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    email: {
        type: String,
        // required: true,
        unique: true
    },
    cell: {
        type: String,
        // required: true,
        unique: true
    },
    balance: {
        type: Number
        // required: true,
        // unique: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: String,
        // required: true
    },
    smsUnitCost: {
        type: Number,
        required: true,
        default: .25
    },
    emailUnitCost: {
        type: Number,
        required: true,
        default: .25
    },
    updatedAt: {
        type: Date
    },
    updatedBy: {
        type: String
    },
    isDisabled: {
        type: Boolean,
        required: true,
        default: false
    },
    smsContacts: [{

        groupName: {
            type: String
        },
        contacts: [
            {
                location: {
                    type: String
                },
                name: {
                    type: String,
                },
                cell: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    required: true,
                    default: Date.now(),
                },
                updatedAt: {
                    type: Date,
                    required: true,
                    default: Date.now(),
                },
                isDisabled: {
                    type: Boolean,
                    required: true,
                    default: false
                }

            }
        ]

    }],
    emailContacts: [{
        groupName: {
            type: String
        },
        contacts: [
            {
                location: {
                    type: String
                },
                name: {
                    type: String,
                },
                email: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    required: true,
                    default: Date.now(),
                },
                updatedAt: {
                    type: Date,
                    required: true,
                    default: Date.now(),
                },
                isDisabled: {
                    type: Boolean,
                    required: true,
                    default: false
                }

            }
        ]

    }],
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    }
    // isPhoneNumberVerified: {
    //     type: Boolean,
    //     required: true,
    //     default: false
    // },
    // isEmailVerified: {
    //     type: Boolean,
    //     required: true,
    //     default: false
    // }
});
userSchema.plugin(uniqueValidator);
const users = mongoose.model('users', userSchema);
module.exports = users;
