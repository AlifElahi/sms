const express = require("express")
const { successResponse, errorResponse } = require('../common/response')
const verify = require('../common/authVerification');
const { mongoType } = require("../database/db_conections");
const transac = require("../database/transectionSchema");
const recharge = require("../database/rechargeSchema");

const his = express.Router();
his.get("/history", verify, async (req, res) =>{

    try {
        let data= await transac.find(
            {
                uId:req.userId
            },{
              
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
his.get("/history/:id", verify, async (req, res) =>{

    try {
        let data= await transac.find(
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
his.get("/transactions", verify, async(req,res) =>{
    try {
        let data= await transac.aggregate([
            {
                $match:{uId: req.userId}
                
            },{
                    $project:{
                        transactionId:"$_id",
                        type:"Debited",
                        name:"$type",
                        unit:"$unit",
                        cost:"$totalCost",
                        time:"$createdAt"
                    }
            }
        ]);
        let rechargeData= await recharge.aggregate([
            {
                $match:{uId: req.userId}
                
            },{
                    $project:{
                        transactionId:"$_id",
                        type:"Credited",
                        name:"recharge",
                        unit:null,
                        cost:"$amount",
                        time:"$createdAt"
                    }
            }
        ]);
        let datas=data.length?rechargeData.length?data.concat(rechargeData):data:rechargeData;

        datae= await datas.sort((a,b) => (new Date(a.time)> new Date(b.time)) ? 1 : ((new Date(b.time) >new Date(a.time)) ? -1 : 0));
        let response={
            transactions:datae
        }
        return successResponse(res,true,response,"")

    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }
})




module.exports = his