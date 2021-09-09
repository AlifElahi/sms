const express = require("express")
const { successResponse, errorResponse } = require('../common/response')
const verify = require('../common/authVerification');
const { mongoType } = require("../database/db_conections");
const transac = require("../database/transectionSchema");
const recharge = require("../database/rechargeSchema");
const users = require("../database/userSchema");
const sms = require("./sms");

const dashb = express.Router();
dashb.get("/", verify, async (req, res) => {

    try {
        let balanced = await users.findOne({
            _id: mongoType().ObjectId(req.userId)
        }, {
            balance: 1
        });
        let temp = await transac.find({ uId: req.userId }).sort({ _id: -1 }).limit(1);
        let ttt = temp[0].createdAt.toString()
        let rt = ttt.split("(");
        let creattime = rt[0].split(" ");
        creattime[2] = "01"
        let rrr = creattime.join(" ");

        let from = req.body.from ? new Date(req.body.from) : new Date(rrr);
       
        let to = req.body.from ? new Date(req.body.to) : temp[0].createdAt;

        let trandata = await transac.aggregate([
            {
                $match: {
                    uId: req.userId,
                    isDisabled: false,
                    createdAt: {
                        $gte: from,
                        $lte: to
                    }
                }
            }, {
                $project: {
                    name: "$type",
                    type: "Debited",
                    transactionId:"$_id",
                    unit: "$unit",
                    cost: "$totalCost",
                    time: "$createdAt"
                }
            }

        ]);
        let rechargeData = await recharge.aggregate([
            {
                $match: {
                    uId: req.userId,
                    createdAt: {
                        $gte: from,
                        $lte: to,
                    }
                }
            }, {
                $project: {
                    name: "Recharge",
                    transactionId:"$_id",
                    type: "Credited",
                    unit: "",
                    cost: "$amount",
                    time: "$createdAt"
                }
            }

        ]);
        let datas = trandata.length ? rechargeData.length ? trandata.concat(rechargeData) : trandata : rechargeData;
        datas.sort((a, b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));



        let trandata1 = await transac.aggregate([
            {
                $match: {
                    uId: req.userId,
                    isDisabled: false
                }
            }, {
                $project: {
                    name: "$type",
                    type: "Debited",
                    transactionId:"$_id",
                    unit: "$unit",
                    cost: "$totalCost",
                    time: "$createdAt"
                }
            },
            { $sort: { time: -1 } },
            { $limit: 5 }


        ]);
        let rechargeData1 = await recharge.aggregate([
            {
                $match: {
                    uId: req.userId,
                }
            }, {
                $project: {
                    name: "$type",
                    transactionId:"$_id",
                    type: "Credited",
                    unit: "",
                    cost: "$amount",
                    time: "$createdAt"
                }
            },
            { $sort: { time: -1 } },
            { $limit: 5 }
        ]);
        let datas1 = trandata1.length ? rechargeData1.length ? trandata1.concat(rechargeData1) : trandata1 : rechargeData1;
        let datas2 = await datas1.sort((a, b) => (b.time > a.time) ? 1 : ((a.time > b.time) ? -1 : 0));

        let pp = []
        if (datas2.length <= 5) {
            pp = datas2
        } else {
            for (let i = 0; i < 5; i++) {
                pp.push(datas2[i])

            }

        }
        let econtacts = await users.aggregate([
            {
                $match: {
                    _id: mongoType().ObjectId(req.userId),
                }

            }, {
                $project: {
                    email: "$emailContacts"
                }
            }, {
                $unwind: "$email"
            }
            , {
                $unwind: "$email.contacts"
            }, {
                $group: {
                    _id: "$_id",
                    count: { $sum: 1 }
                }
            }
        ])
        let scontacts = await users.aggregate([
            {
                $match: {
                    _id: mongoType().ObjectId(req.userId),
                }

            }, {
                $project: {
                    sms: "$smsContacts"
                }
            }, {
                $unwind: "$sms"
            }
            , {
                $unwind: "$sms.contacts"
            }, {
                $group: {
                    _id: "$_id",
                    count: { $sum: 1 }
                }
            }
        ])

        let sentsms = await transac.aggregate([
            {
                $match: {
                    uId: req.userId,
                    isDisabled: false,
                    type: "sms"
                }
            }, {
                $group: {
                    _id: "$uId",
                    count: { $sum: "$unit" }
                }
            }

        ]);
        let sentemail = await transac.aggregate([
            {
                $match: {
                    uId: req.userId,
                    isDisabled: false,
                    type: "email"
                }
            }, {
                $group: {
                    _id: "$uId",
                    count: { $sum: "$unit" }
                }
            }

        ]);

        let responce = {
            balance: balanced.balance,
            totalEmailContacts: econtacts.length ? econtacts[0].count : 0,
            totalSMSContacts: scontacts.length ? scontacts[0].count : 0,
            smsSent: sentsms.length ? sentsms[0].count : 0,
            emailSent: sentemail.length ? sentemail[0].count : 0,
            transactions: datas,
            last5transactions: pp
        }



        return successResponse(res, true, responce, "")

    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})


dashb.get("/history/:id", verify, async (req, res) => {

    try {
        let data = await transac.find(
            {
                _id: mongoType().ObjectId(req.params.id),
            }
        )
        if (data) {
            successResponse(res, true, data, "")
        } else {
            throw new Error('No data found')
        }
    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})


dashb.get("/transactions", verify, async (req, res) => {
    try {
        let data = await transac.aggregate([
            {
                $match: { uId: req.userId }

            }, {
                $project: {
                    transactionId: "$_id",
                    type: "Debited",
                    name: "$type",
                    unit: "$unit",
                    cost: "$totalCost",
                    tiem: "$createdAt"
                }
            }
        ]);
        let rechargeData = await transac.aggregate([
            {
                $match: { uId: req.userId }

            }, {
                $project: {
                    transactionId: "$_id",
                    type: "Creebited",
                    name: "recharge",
                    unit: null,
                    cost: "$amount",
                    tiem: "$createdAt"
                }
            }
        ]);
        let datas = data.length ? rechargeData.length ? data.concat(rechargeData) : data : rechargeData;

        datas.sort((a, b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));
        return successResponse(res, true, datas, "")

    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})




module.exports = dashb