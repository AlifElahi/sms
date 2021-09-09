const express = require("express")
const { successResponse, errorResponse } = require('../common/response')
const verify = require('../common/authVerification')
const emails = require('../database/emailContactsSchema')
const cell = require('../database/cellContactsSchema')
const users = require('../database/userSchema')
const { mongoType } = require("../database/db_conections")
const e = require("express")

const contatcs = express.Router();

// get user specific contacts
contatcs.get("/own/:type?", verify, async (req, res) => {
    try {
        let data1
        if (!req.params.type) {
            let emailList = await users.find(
                {
                    _id: mongoType().ObjectId(req.userId)
                },
                {
                    emailContacts: 1
                }
            );
            let cells = await users.find(
                {
                    _id: mongoType().ObjectId(req.userId)
                },
                {
                    smsContacts: 1
                }
            );
            data1 = {
                email: emailList[0].emailContacts,
                cell: cells[0].smsContacts
            }

            if (data1) {
                return successResponse(res, true, data1, "")
            }
        }
        let data = req.params.type == "email" ? await users.find(
            {
                _id: mongoType().ObjectId(req.userId)
            },
            {
                emailContacts: 1
            }
        ) : req.params.type == "cell" ? await users.find(
            {
                _id: mongoType().ObjectId(req.userId)
            },
            {
                smsContacts: 1
            }
        ) : null

        if (data && data.length) {
            let datas = req.params.type == "cell" ? {
                cell: data[0].smsContacts

            } : {
                    email: data[0].emailContacts
                }
            return successResponse(res, true, datas, "")
        } else {
            let dd = []
            return successResponse(res, true, dd, "")

        }

    } catch (err) {
        console.log(err);
        return errorResponse(res, 400, {}, err.message)
    }


});

// get all contacts
contatcs.get("/official/:type?", verify, async (req, res) => {
    try {
        let data1
        if (!req.params.type) {
            let emailList = await emails.aggregate([
                {
                    $match: {
                        createdBy: { $ne: req.userId },
                        isDisabled: false
                    }
                },
                {
                    $project: {
                        profession: '$profession',
                        contacts: {
                            profession: '$profession',
                            location: '$location',
                            name: '$name'
                            // email: '$email'
                        }
                    }
                },
                {
                    $group: {
                        _id: '$profession',
                        contacts: {
                            $push: '$contacts'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        professionGroup: '$_id',
                        contacts: '$contacts'
                    }
                }
            ]);
            let cells = await cell.aggregate([
                {
                    $match: {
                        createdBy: { $ne: req.userId },
                        isDisabled: false
                    }
                },
                {
                    $project: {
                        profession: '$profession',
                        contacts: {
                            profession: '$profession',
                            location: '$location',
                            name: '$name',
                            // email: '$email'
                        }
                    }
                },
                {
                    $group: {
                        _id: '$profession',
                        contacts: {
                            $push: '$contacts'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        professionGroup: '$_id',
                        contacts: '$contacts'
                    }
                }
            ])

            data1 = {
                email: emailList,
                cell: cells
            }

            if (data1) {
               return successResponse(res, true, data1, "")
            } else {
                throw new Error('data not found')
            }
        }
        let data = req.params.type == "email" ? await emails.aggregate([
            {
                $match: {
                    createdBy: { $ne: req.userId },
                    isDisabled: false
                }
            },
            {
                $project: {
                    profession: '$profession',
                    contacts: {
                        profession: '$profession',
                        location: '$location',
                        name: '$name',
                        // email: '$email'
                    }
                }
            },
            {
                $group: {
                    _id: '$profession',
                    contacts: {
                        $push: '$contacts'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    professionGroup: '$_id',
                    contacts: '$contacts'
                }
            }
        ]) : req.params.type == "cell" ? await cell.aggregate([
            {
                $match: {
                    createdBy: { $ne: req.userId },
                    isDisabled: false
                }
            },
            {
                $project: {
                    profession: '$profession',
                    contacts: {
                        profession: '$profession',
                        location: '$location',
                        name: '$name'
                        // email: '$email'
                    }
                }
            },
            {
                $group: {
                    _id: '$profession',
                    contacts: {
                        $push: '$contacts'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    professionGroup: '$_id',
                    contacts: '$contacts'
                }
            }
        ]) : null

        if (data.length) {
            successResponse(res, true, data, "")
        } else {
            successResponse(res, true, {}, "")

        }

    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }

});

// get detail of a contact
contatcs.get("/detail/:type/:id", verify, async (req, res) => {
    try {
        let data;
        if (req.params.type == 'email') {
            data = await emails.findOne({
                _id: mongoType().ObjectId(req.params.id),
                isDisabled: false
            }, {
                createdAt: 0,
                createdBy: 0
            });
        }
        if (req.params.type == 'cell') {
            data = await cell.findOne({
                _id: mongoType().ObjectId(req.params.id),
                isDisabled: false
            }, {
                createdAt: 0,
                createdBy: 0
            });
        }
        if (data) {
            successResponse(res, true, data, "")
        } else {
            throw new Error('data not found')
        }
    } catch (err) {
        errorResponse(res, 400, {}, err.message)

    }
});

//update single contact
contatcs.post("/update/:type/:id/:group", verify, async (req, res) => {
    try {
        if (req.params.type == 'email') {
            if (req.body.email) {
                let finds = await users.aggregate([
                    {
                        $match: {
                            _id: mongoType().ObjectId(req.userId)
                        }
                    }, {
                        $unwind: "$emailContacts"
                    },
                    {
                        $match: {
                            'emailContacts.groupName': req.params.group
                        }
                    }, {
                        $unwind: "$emailContacts.contacts"
                    }, {
                        $match: {
                            'emailContacts.contacts._id': { $ne: mongoType().ObjectId(req.params.id) },
                            'emailContacts.contacts.email': req.body.email
                        }
                    }
                ]);
                if (finds.length) { req.body.email = null
                if(finds[0].emailContacts.contacts.name===req.body.name)throw new Error("email already exists")
                }
            }
console.log(req.body.email,req.body.name);
            if (req.body.email && req.body.name) {
                let check = await users.updateOne(
                    {
                        _id: mongoType().ObjectId(req.userId)
                    },
                    {
                        $set: {
                            'emailContacts.$[i].contacts.$[j].email': req.body.email
                        }
                    }, {
                    arrayFilters: [{
                        'i.groupName': req.params.group
                    }, {
                        'j._id': mongoType().ObjectId(req.params.id)
                    }
                    ]
                }

                )
                if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
                else return successResponse(res, true, {}, "updated sucessfully")
            }
            if (req.body.email) {
                let check = await users.updateOne(
                    {
                        _id: mongoType().ObjectId(req.userId)
                    },
                    {
                        $set: {
                            'emailContacts.$[i].contacts.$[j].email': req.body.email,
                            'emailContacts.$[i].contacts.$[j].name': req.body.name
                        }
                    }, {
                    arrayFilters: [{
                        'i.groupName': req.params.group
                    }, {
                        'j._id': mongoType().ObjectId(req.params.id)
                    }
                    ]
                }

                )
                if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
                else return successResponse(res, true, {}, "updated sucessfully")
            }
            if (req.body.name) {
                let check = await users.updateOne(
                    {
                        _id: mongoType().ObjectId(req.userId)
                    },
                    {
                        $set: {
                            'emailContacts.$[i].contacts.$[j].name': req.body.name
                        }
                    }, {
                    arrayFilters: [{
                        'i.groupName': req.params.group
                    }, {
                        'j._id': mongoType().ObjectId(req.params.id)
                    }
                    ]
                }

                )
                if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
                else return successResponse(res, true, {}, "updated sucessfully")
            }

        }
        if (req.params.type == 'cell') {
            if (req.body.cell) {
                let finds = await users.aggregate([
                    {
                        $match: {
                            _id: mongoType().ObjectId(req.userId)
                        }
                    }, {
                        $unwind: "$smsContacts"
                    },
                    {
                        $match: {
                            'smsContacts.groupName': req.params.group
                        }
                    }, {
                        $unwind: "$smsContacts.contacts"
                    }, {
                        $match: {
                            'smsContacts.contacts._id': { $ne: mongoType().ObjectId(req.params.id) },

                            'smsContacts.contacts.cell': req.body.cell
                        }
                    }
                ]);
                if (finds.length) 
                {req.body.cell = null
                    console.log(finds[0]);
                if(finds[0].smsContacts.contacts.name===req.body.name)throw new Error("number already exists")
            }}
            if (req.body.cell && req.body.name) {
                let check = await users.updateOne(
                    {
                        _id: mongoType().ObjectId(req.userId)
                    },
                    {
                        $set: {
                            'smsContacts.$[i].contacts.$[j].name': req.body.name,
                            'smsContacts.$[i].contacts.$[j].cell': req.body.cell
                        }
                    }, {
                    arrayFilters: [{
                        'i.groupName': req.params.group
                    }, {
                        'j._id': mongoType().ObjectId(req.params.id)
                    }
                    ]
                }

                )
                if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
                else return successResponse(res, true, {}, "updated sucessfully")
            }
            if (req.body.cell) {
                let check = await users.updateOne(
                    {
                        _id: mongoType().ObjectId(req.userId)
                    },
                    {
                        $set: {
                            'smsContacts.$[i].contacts.$[j].cell': req.body.cell
                        }
                    }, {
                    arrayFilters: [{
                        'i.groupName': req.params.group
                    }, {
                        'j._id': mongoType().ObjectId(req.params.id)
                    }
                    ]
                }

                )
                if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
                else return successResponse(res, true, {}, "updated sucessfully")
            }
            if (req.body.name) {
                let check = await users.updateOne(
                    {
                        _id: mongoType().ObjectId(req.userId)
                    },
                    {
                        $set: {
                            'smsContacts.$[i].contacts.$[j].name': req.body.name
                        }
                    }, {
                    arrayFilters: [{
                        'i.groupName': req.params.group
                    }, {
                        'j._id': mongoType().ObjectId(req.params.id)
                    }
                    ]
                }

                )
                if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
                else return successResponse(res, true, {}, "updated sucessfully")
            }
            throw new Error("unexpected update requeste has been made")
        }
    } catch (err) {
        errorResponse(res, 400, {}, err.message)

    }
});

//delete single contact
contatcs.delete("/:type/:id/:group", verify, async (req, res) => {
    try {
        if (req.params.type == 'email') {
            let check = await users.updateOne(
                {
                    _id: mongoType().ObjectId(req.userId)
                },
                {
                    $pull: {
                        'emailContacts.$[i].contacts': {
                            _id: mongoType().ObjectId(req.params.id)
                        }
                    }
                }, {
                arrayFilters: [{
                    'i.groupName': req.params.group
                }
                ]
            }


            )
            if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
            else return successResponse(res, true, { id: req.params.id }, "deleted sucessfully")


        }
        if (req.params.type == 'cell') {

            let check = await users.updateOne(
                {
                    _id: mongoType().ObjectId(req.userId)
                },
                {
                    $pull: {
                        'smsContacts.$[i].contacts': {
                            _id: mongoType().ObjectId(req.params.id)
                        }
                    }
                }, {
                arrayFilters: [{
                    'i.groupName': req.params.group
                }
                ]
            }

            )
            if (check.n == 0 || check.nModified == 0) throw new Error("data is not updated")
            else return successResponse(res, true, { id: req.params.id }, "deleted sucessfully")
        }
    } catch (err) {
        errorResponse(res, 400, {}, err.message)

    }
});



function findmail(group, mail) {
    return group[0].emailArr.contacts.length > 0 ? group[0].emailArr.contacts.find(element =>
        element.email == mail
    ) : false

}
function findcell(group, cell) {
    return group[0].smsArr.contacts.length > 0 ? group[0].smsArr.contacts.find(element =>
        element.cell == cell
    ) : false

}

//add contacts
contatcs.post('/add/:type', verify, async (req, res) => {
    try {
        if (!req.body.contacts.length) throw new Error('no contacts to upload')
        let count=req.body.contacts.length;
        if (req.params.type == 'email') {
            for (let i = 0; i < req.body.contacts.length; i++) {
                
                const mapData = req.body.contacts[i];
                if (mapData.profession===""||mapData.email===""){
                    count--
                    continue;}
                const groupname = mapData.profession.toLowerCase()
                const newContacts = {
                    location: mapData.location ? mapData.location : "",
                    name: mapData.name ? mapData.name : "",
                    email: mapData.email,
                    createdAt: Date.now(),
                    isDisabled: false
                }
                let group = await users.aggregate([
                    {
                        $match: {
                            _id: mongoType().ObjectId(req.userId)
                        }
                    },
                    {
                        $project: {
                            emailArr: '$emailContacts'
                        }
                    },
                    {
                        $unwind: '$emailArr'
                    },
                    {
                        $match: {
                            'emailArr.groupName': groupname
                        }
                    }
                ]

                );

                if (group.length) {
                    let found = await findmail(group, mapData.email)

                    if (!found) {
                        let check = await users.updateOne({
                            _id: mongoType().ObjectId(req.userId),
                            isDisabled: false
                        }, {
                            $push: {
                                'emailContacts.$[i].contacts': newContacts
                            }
                        }, {
                            arrayFilters: [{
                                'i.groupName': groupname
                            }
                            ]
                        });
                        if(check.n !==0&& check.nModified) count--;
                    }
                } else {
                    let newGroup = {
                        groupName: groupname,
                        contacts: [newContacts]
                    }
                    const check = await users.updateOne({
                        _id: mongoType().ObjectId(req.userId),
                        isDisabled: false
                    }, {
                        $push: {
                            'emailContacts': newGroup
                        }
                    });
                    if(check.n !==0&& check.nModified) count--;

                }

            }
            if(count== req.body.contacts.length) throw new Error("Duplicate Data")
            successResponse(res, true, {failedQty:count}, "uploaded")
        }
        if (req.params.type == 'cell') {
            for (let i = 0; i < req.body.contacts.length; i++) {
                const mapData = req.body.contacts[i];
                if (mapData.profession===""||mapData.cell==="") {count--
                     continue};
                const groupname = mapData.profession.toLowerCase()
                const newContacts = {
                    location: mapData.location ? mapData.location : "",
                    name: mapData.name ? mapData.name : "",
                    cell: mapData.cell,
                    createdAt: Date.now(),
                    isDisabled: false
                }
                let group = await users.aggregate([
                    {
                        $match: {
                            _id: mongoType().ObjectId(req.userId)
                        }
                    },
                    {
                        $project: {
                            smsArr: '$smsContacts'
                        }
                    },
                    {
                        $unwind: '$smsArr'
                    },
                    {
                        $match: {
                            'smsArr.groupName': groupname
                        }
                    }
                ]

                );
                if (group.length) {
                    let found = await findcell(group, mapData.cell)
                    if (!found) {
                        const check = await users.updateOne({
                            _id: mongoType().ObjectId(req.userId),
                            isDisabled: false
                        }, {
                            $push: {
                                'smsContacts.$[i].contacts': newContacts
                            }
                        }, {
                            arrayFilters: [{
                                'i.groupName': groupname
                            }
                            ]
                        });
                        if(check.n !==0&& check.nModified) count--;

                    }
                } else {
                    let newGroup = {
                        groupName: groupname,
                        contacts: [newContacts]
                    }
                    const check = await users.updateOne({
                        _id: mongoType().ObjectId(req.userId),
                        isDisabled: false
                    }, {
                        $push: {
                            'smsContacts': newGroup
                        }
                    });
                    if(check.n !==0&& check.nModified) count--;

                }
            }

            // await cell.insertMany(req.body.contacts)
            if(count== req.body.contacts.length) throw new Error("Duplicate Data")
            successResponse(res, true, {failedQty:count }, "uploaded")
        }


    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }

});



module.exports = contatcs