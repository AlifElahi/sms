const express = require("express")
const { successResponse, errorResponse } = require('../common/response')
const verify = require('../common/authVerification');
const { mongoType } = require("../database/db_conections");
const transac = require("../database/transectionSchema");
const recharge = require("../database/rechargeSchema");
const users = require("../database/userSchema");

const re = express.Router();
re.post("/", verify, async (req, res) => {

    try {
        let temp = new recharge({
            type:"recharge",
            uId:req.userId,
            amoutn:req.body.amount,
            trancationId:Date.now(),
            createdAt:Date.now()
        })
        await temp.save();
        return successResponse(res,true,{},"recharge log created")

    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})



module.exports = re