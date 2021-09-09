const express = require("express")
const { successResponse, errorResponse } = require('../common/response')
const verify = require('../common/authVerification');
const users = require("../database/userSchema");
const { mongoType } = require("../database/db_conections");
const transac = require("../database/transectionSchema");
const { smsSend } = require("../common/smsSendFile");

const user = express.Router();


user.post("/updatename", verify, async (req, res) => {
    try {
        let data = await users.updateOne(
            {
                    _id:mongoType().ObjectId(req.userId),
                    isDisabled: false
            }, {
                $set: {
                    name:req.body.name
                }
            });
            if(check.n != 0 && check.nModified != 0) {
            successResponse(res, true, {}, "")
        } else {
            throw new Error('data not found')
        }
    } catch (err) {
        errorResponse(res, 400, {}, err.message)

    }

});
user.post("/updatemail", verify, async (req, res) => {
    try {
        let data = await users.updateOne(
            {
                    _id:mongoType().ObjectId(req.userId),
                    isDisabled: false
            }, {
                $set: {
                    email:req.body.email
                }
            });
            if(check.n != 0 && check.nModified != 0) {
            successResponse(res, true, {}, "")
        } else {
            throw new Error('data not found')
        }
    } catch (err) {
        errorResponse(res, 400, {}, err.message)

    }

});
module.exports = user