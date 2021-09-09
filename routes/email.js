const express = require("express")
const { successResponse, errorResponse } = require('../common/response')
const verify = require('../common/authVerification');
const emails = require("../database/emailContactsSchema");
const users = require("../database/userSchema");
const { mongoType } = require("../database/db_conections");
const transac = require("../database/transectionSchema");
const { getMailTransporter } = require("../common/emailConfiguration")
const transporter = getMailTransporter()


const email = express.Router();

email.get("/getemailcategory", verify, async (req, res) => {
    try {
        let data = await emails.aggregate([
            {
                $match: {
                    createdBy: { $ne: req.userId },
                    isDisabled: false
                }
            }, {
                $project: {
                    id: '$_id',
                    profession: "$profession",
                    email: '$email'
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
        let ownData =await users.aggregate([
            {
                $match: {
                    _id: mongoType().ObjectId(req.userId),
                    isDisabled: false
                }
            }, {
                $project: {
                    
                    email: '$emailContacts'
                }
            },
            {
                $unwind:'$email'
            },
            {
                $unwind:'$email.contacts'
            },
            {
                $project:{
                    groupName:'$email.groupName',
                    contact:'$email.contacts'
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

email.post('/sendmeemail', verify, async (req, res) => {
    try {
        let user = await users.findOne({
            _id: mongoType().ObjectId(req.userId),
            isDisabled: false
        },
            {
                balance: 1,
                emailUnitCost: 1,
                email: 1,
            });
        if (!user.email)
            throw new Error("user not found")

        if (user.balance < user.emailUnitCost) throw new Error("Insuffiant balance")

        let mailoptions = {
            from: 'marketing@bigdigi.com.bd',
            to: user.email,
            subject: req.body.subject,
            html: req.body.message
        }


        transporter.sendMail(mailoptions, async (error, info) => {
            if (error) {
                console.log(error, 'mail send failed');
                throw new Error('mail send failed')
            } else {
                let user = await users.findOne({
                    _id: mongoType().ObjectId(req.userId)
                }, {
                    balance: 1,
                    emailUnitCost: 1
                })
                // transac history entry
                let history = new transac({
                    type: 'email',
                    uId: req.userId,
                    sentTo: user.email,
                    unit: 1,
                    isTest: true,
                    createdAt: Date.now(),
                    totalCost: user.emailUnitCost,
                    unitCost: user.emailUnitCost,
                    message: req.body.message
                })
                await history.save()
                const payment = user.emailUnitCost
                //user balance update
                let check = await users.updateOne({
                    _id: mongoType().ObjectId(req.userId)
                },
                    {
                        $inc: {
                            balance: -payment
                        }
                    }
                )
                if (check.n == 0 || check.nModified == 0) throw new Error('balance not modified')
                user = await users.findOne({
                    _id: mongoType().ObjectId(req.userId)
                }, {
                    balance: 1
                })
                successResponse(res, true, { balance: user.balance }, "email sent")

            }
        })




    }
    catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})


email.post('/send', verify, async (req, res) => {
    try {
        let recipents = [];
        let dat = await users.findOne({
            _id: mongoType().ObjectId(req.userId)
        }, {
            balance: 1,
            emailUnitCost: 1
        });
        if (dat.balance < req.body.bill) throw new Error("Insuffiant balance")
        let totalQty = 0
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
                            email:"$emailContacts"
                        }
                    },{
                        $unwind: "$email"
                    },
                    {
                        $match:{
                            'email.groupName':element.category
                        }
                    },
                    {
                        $unwind: "$email.contacts"
                    },
                    {
                        $project:{
                            email:'$email.contacts.email'
                        }
                    },
                    {
                        $sample: { size: element.qty }
                    }
                ])
            } else if (element.type == 'official') {
                data = await emails.aggregate([
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

            if (!data.length) throw new Error("something went wrong")
            for (let i = 0; i < data.length; i++) {
                recipents.push(data[i].email)
            }
        }
        // console.log("sdsdsdsdsddsd", recipents);
        // recipents = ["alifelahikhan@gmail.com", "alifelahi.work@gmail.com"]
        let billamount = totalQty * dat.emailUnitCost
        if (billamount < req.body.bill) throw new Error("cost miss match")
        if (billamount > dat.balance) throw new Error("Insuffiant balance")

        let mailoptions = {
            from: 'marketing@bigdigi.com.bd',
            bcc: recipents.toString(),
            subject: req.body.subject,
            html: req.body.message
        }


        //api of email intigration

        // transac history entry
        try {
            let info = await transporter.sendMail(mailoptions);
            if (info) {
                let balance = totalQty * dat.emailUnitCost
                console.log(balance, totalQty, dat.emailUnitCost);
                let history = new transac({
                    type: 'email',
                    uId: req.userId,
                    sentTo: recipents,
                    unit: totalQty,
                    isTest: false,
                    createdAt: Date.now(),
                    totalCost: balance,
                    unitCost: dat.emailUnitCost,
                    message: req.body.message
                })
                await history.save()
                const payment = totalQty * dat.emailUnitCost
                //user balance update
                let check = await users.updateOne({
                    _id: mongoType().ObjectId(req.userId)
                },
                    {
                        $inc: {
                            balance: -payment
                        }
                    }
                )
                if (check.n == 0 || check.nModified == 0) throw new Error('balance not modified')
                let user = await users.findOne({
                    _id: mongoType().ObjectId(req.userId)
                }, {
                    balance: 1
                })
                return successResponse(res, true, { balance: user.balance }, "email sent")
            }

        } catch (error) {
           
            errorResponse(res, 400, {}, "email sent failed")
        }

        // console.log(error, 'mail send failed');
        // throw new Error('mail send failed')




    }
    catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})
module.exports = email