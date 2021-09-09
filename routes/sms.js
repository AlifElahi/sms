const express = require("express")
const { successResponse, errorResponse } = require('../common/response')
const verify = require('../common/authVerification');
const cell = require("../database/cellContactsSchema");
const users = require("../database/userSchema");
const { mongoType } = require("../database/db_conections");
const transac = require("../database/transectionSchema");
const { smsSend } = require("../common/smsSendFile");

const sms = express.Router();

//get sms category
sms.get("/getsmscategory", verify, async (req, res) => {
    try {
        let data = await cell.aggregate([
            {
                $match: {
                    // createdBy: { $ne: req.userId },
                    isDisabled: false
                }
            }, {
                $project: {
                    id: '$_id',
                    profession: "$profession",
                    cell: '$cell'
                }
            },
            {
                $group: {
                    _id: "$profession",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: '$count'
                }
            }
        ]);
        let ownData = await users.aggregate([
            {
                $match: {
                    _id: mongoType().ObjectId(req.userId),
                    isDisabled: false
                }
            }, {
                $project: {
                    
                    cell: '$smsContacts'
                }
            },
            {
                $unwind:'$cell'
            }, 
            {
                $unwind:'$cell.contacts'
            },
            {
                $project:{
                    groupName:'$cell.groupName',
                    contact:'$cell.contacts'
                }
            },
            {
                $group: {
                    _id: "$groupName",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: '$count'
                }
            }
        ]);
        let response = {
            official: data,
            own: ownData
        }
        if (data.length || ownData.length) {
            successResponse(res, true, response, "")
        } else {
            throw new Error('data not found')
        }
    } catch (err) {
        errorResponse(res, 400, {}, err.message)

    }

});

//send sms test
sms.post('/sendmesms', verify, async (req, res) => {
    try {
        console.log("req message", req.body.message);
        let user = await users.findOne({
            _id: mongoType().ObjectId(req.userId),
            isDisabled: false
        },
            {
                cell: 1,
                balance: 1,
                smsUnitCost: 1
            });
        if (user.balance < user.smsUnitCost) throw new Error("insufficiant balance");
        if (!user.cell) throw new Error("no user data found");

        // sms api will be called
        let response = await smsSend(req.body.message, [user.cell])
        if (response.data) {
            let check = await users.updateOne({
                _id: mongoType().ObjectId(req.userId)
            },
                {
                    $inc: {
                        balance: -user.smsUnitCost,
                    }
                }
            )

            let history = new transac({
                type: 'sms',
                uId: req.userId,
                sentTo: [user.cell],
                unit: 1,
                isTest: true,
                createdAt: Date.now(),
                totalCost: user.smsUnitCost,
                unitCost: user.smsUnitCost,
                message: req.body.message
            })
            await history.save()
            if (check.n == 0 || check.nModified == 0)
                throw new Error('balance not modified')
            let userInfo = await users.findOne({
                _id: mongoType().ObjectId(req.userId),
                isDisabled: false
            },
                {
                    balance: 1,

                });

            successResponse(res, true, { balance: userInfo.balance }, "message sent")
        } else {
            errorResponse(res, 400, {response}, "something went wrong")

        }
    }
    catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})

//send sms bulk
sms.post('/send', verify, async (req, res) => {
    try {
        let recipents = [];
        let dat = await users.findOne({
            _id: mongoType().ObjectId(req.userId)
        }, {
            balance: 1,
            smsUnitCost: 1
        });
        if (dat.balance < req.body.bill) throw new Error("Insuffiant balance")
        let totalQty = 0
        console.log(req.body);
        for (let i = 0; i < req.body.groups.length; i++) {
            element = req.body.groups[i]
            totalQty = element.qty + totalQty
            let data;
            if (element.type == 'own') {
                data = await users.aggregate([
                    {
                        $match: {
                            _id:mongoType().ObjectId(req.userId),
                            isDisabled: false
                        }
                    },
                    {
                        $project:{
                            cell:"$smsContacts"
                        }
                    },{
                        $unwind: "$cell"
                    },
                    {
                        $match:{
                            'cell.groupName':element.category
                        }
                    },
                    {
                        $unwind: "$cell.contacts"
                    },
                    {
                        $project:{
                            cell:'$cell.contacts.cell'
                        }
                    },
                    {
                        $sample: { size: element.qty }
                    }
                ])

            } else if (element.type == 'official') {
                data = await cell.aggregate([
                    {
                        $match: {
                            createdBy: { $ne: req.userId },
                            profession: element.category,
                            isDisabled: false
                        }
                    },
                    {
                        $sample: { size: element.qty }
                    }
                ])
            }
            console.log(data, "data");
            if (!data.length) throw new Error("something went wrong")

            for (let i = 0; i < data.length; i++) {
                recipents.push(data[i].cell)
            }
        }
        let billamount = totalQty * dat.smsUnitCost
        if (billamount < req.body.bill) throw new Error("cost miss match")
        if (billamount > dat.balance) throw new Error("Insuffiant balance")
        // api of sms intigration
        let response = await smsSend(req.body.message, recipents)
        // console.log("rrr", response);
        if (response.data.error_string == null) {
            
            // transac history entry
            let history = new transac({
                type: 'sms',
                uId: req.userId,
                sentTo: recipents,
                unit: totalQty,
                createdAt: Date.now(),
                isTest: false,
                totalCost: totalQty * dat.smsUnitCost,
                unitCost: dat.smsUnitCost,
                message: req.body.message
            })
            await history.save()
            const payment = dat.smsUnitCost * totalQty
            //user balance update
            let check = await users.updateOne({
                _id: mongoType().ObjectId(req.userId)
            },
                {
                    $inc: {
                        balance: -payment,
                    }
                }
            )
            if (check.n == 0 || check.nModified == 0) throw new Error('balance not modified')
            let user = await users.findOne({
                _id: mongoType().ObjectId(req.userId)
            }, {
                balance: 1
            })
            successResponse(res, true, { balance: user.balance }, "message sent")
        } else {
            errorResponse(res, 503, {}, "message sent failed")
        }
    }
    catch (err) {
        console.log("err", err);
        errorResponse(res, 400, {}, err.message)
    }
})


module.exports = sms