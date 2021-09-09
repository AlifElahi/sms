const { response } = require("express");
const { connect } = require("../database/db_conections");
connect();
const jwt = require('jsonwebtoken');
require('dotenv/config')
const{errorResponse}=require('./response')

module.exports=function(req,res,next) {
    const token= req.header('accessToken');
    if(!token){
    return errorResponse(res,403,{},"authorization missing");}
    try {
        const varification= jwt.verify(token,process.env.TOKEN_SECRET1);
        
        if(!varification) return errorResponse(res,403,{},"invalid authorization token");
        req.userId=varification.id
        next();
    } catch (err) {
        errorResponse(res,403,{},"jwt expires");
    }

    
}