const express = require("express")
const bcrypt = require("bcrypt")
const users = require('../database/userSchema')
const jwt = require('jsonwebtoken')
const verify = require('../common/authVerification')
require('dotenv/config')
const { successResponse, errorResponse } = require('../common/response')
const { mongoType } = require("../database/db_conections")
const { getMailTransporter } = require("../common/emailConfiguration")
const transporter = getMailTransporter();


const auth = express.Router();


//signup

auth.post("/signup", async (req, res) => {
    try {

        const salt = await bcrypt.genSaltSync(10);
        const hashedPass = await bcrypt.hashSync(req.body.password, salt);
        let user = new users({
            name: req.body.name,
            userName: req.body.email,
            category: "user",
            email: req.body.email,
            cell: req.body.cell,
            balance: 0,
            smsContacts:[],
            emailContacts:[],
            password: hashedPass,
            createdAt: Date.now()
        })
        await user.save();
        let activationToken = await jwt.sign({ id: user._id, email: user.email }, process.env.TOKEN_SECRET_ACC);
        let mailoptions = {
            from: 'marketing@bigdigi.com.bd',
            to: req.body.email,
            subject: 'BigDigi Account Activation',
            html: `<h1>please Click on the link here to verify your email account and acctivate the BigDigi Account</h1>
            <p>https://smspathao.herokuapp.com/auth/activation/${activationToken} </p>`
            
        }
        let token = await jwt.sign({ id: user._id }, process.env.TOKEN_SECRET1, { expiresIn: '1h' });
        let refreshTokenSecret = process.env.TOKEN_SECRET2 + user.password
        let refresh = await jwt.sign({ id: user._id, email: user.email }, refreshTokenSecret, { expiresIn: '12h' });
        let response = {
            id: user._id,
            name: user.name,
            email: user.email,
            cell: user.cell,
            userName: user.userName,
            balance: 0,
            smsUnitCost: user.smsUnitCost,
            emailUnitCost: user.emailUnitCost,
            isVerified: false,
            accessToken: token,
            refreshToken: refresh
        }
        console.log('mail waiting');
        await transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log(error, 'mail send failed');

            }
        })
        successResponse(res, true, response, "signUp sucessfull");

    } catch (err) {
        errorResponse(res, 400, err, err.message)
    }

});


auth.put("/accountactivation/:email", async (req, res) => {
    try {
        let user = await users.findOne({ email: req.params.email })
        if (!user) throw new Error("There is no acount with this email")
        if (user.isVerified) throw new Error("The accoutn is already activated")
        let activationToken = await jwt.sign({ id: user._id, email: user.email }, process.env.TOKEN_SECRET_ACC);
        let mailoptions = {
            from: 'marketing@bigdigi.com.bd',
            to: user.email,
            subject: 'BigDigi Account Activation',
            html: `<h1>please Click on the link here to verify your email account and acctivate the BigDigi Account</h1>
            <p>https://smspathao.herokuapp.com/auth/activation/${activationToken} </p>`
            // <p>http://192.168.0.103:5000/auth/activation/${activationToken} </p>`
            // html: "<h1>please Click on the link here to verify your email account and acctivate the BigDigi Account</h1>"
        }
        await transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log(error, 'mail send failed');
                errorResponse(res, 400, error, "email server failed")
            } else {
                successResponse(res, true,
                    {}, "mail sent");
            }
        })

    } catch (err) {
        errorResponse(res, 400, err, err.message)
    }
});

//login

auth.post("/login", async (req, res) => {

    try {
        let data = await users.findOne({
            email: req.body.email
        });
        if (!data) throw new Error("Email can not be found")
        if (!data.isVerified) throw new Error("Account is not activated")
        let validPass = await bcrypt.compareSync(req.body.password, data.password);
        if (!validPass) throw new Error("Wrong Password")
        let token = jwt.sign({ id: data._id }, process.env.TOKEN_SECRET1, { expiresIn: '1h' });
        let refreshTokenSecret = process.env.TOKEN_SECRET2 + data.password
        let refresh = jwt.sign({ id: data._id, email: data.email }, refreshTokenSecret, { expiresIn: '12h' });
        let response = {
            id: data._id,
            name: data.name,
            email: data.email,
            cell: data.cell,
            userName: data.userName,
            isVerified: data.isVerified,
            balance: data.balance,
            accessToken: token,
            smsUnitCost: data.smsUnitCost,
            emailUnitCost: data.emailUnitCost,
            refreshToken: refresh
        }
        successResponse(res, true, response, "Login sucessfull");

    } catch (err) {
        errorResponse(res, 400, {}, err.message)
    }

});

//FORGET PASSWORD MAIL

auth.post("/forgetpassword", async (req, res) => {

    try {

        let user = await users.findOne({
            email: req.body.email
        })
        if (!user._id) throw new Error("Email can not be found")
        let token = await jwt.sign({ id: user._id, email: user.email }, process.env.TOKEN_SECRET1, { expiresIn: '1h' });
        let mailoptions = {
            from: 'marketing@bigdigi.com.bd',
            to: req.body.email,
            subject: 'BigDigi Account password reset link',
            html: `<h1>please Click on the link here to reset the password of your BigDigi Account</h1>
            <p>https://bigdigi.com.bd/resetpassword/${token} </p>`
        }
        await transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log('mail send failed');
                // errorResponse(res, 400, error,"email server failed")
            } else { successResponse(res, true, {}, "mail has been sent"); }
        })
        // successResponse(res, true, {}, "mail has been sent");

    } catch (err) {
        errorResponse(res, 400, err, err.message)
    }

});
// reNewToken

auth.get('/renewtoken/:id', async (req, res) => {
    try {
        const refreshToken = req.header('refreshToken');
        if (!refreshToken) {
            errorResponse(res, 403, {}, "authorization missing");
        }
        let data = await users.findOne({
            _id: mongoType().ObjectId(req.params.id)
        }, {
        });

        let refreshTokenSecret = process.env.TOKEN_SECRET2 + data.password

        const varification = await jwt.verify(refreshToken, refreshTokenSecret);
        if (!varification) {
            errorResponse(res, 403, {}, "invalid authorization token");
        }
        let token = jwt.sign({ id: data._id }, process.env.TOKEN_SECRET1, { expiresIn: '1h' });
        let refresh = jwt.sign({ id: data._id, email: data.email }, refreshTokenSecret, { expiresIn: '12h' });
        let response = {
            newAccessToken: token,
            newRefreshToken: refresh
        }
        successResponse(res, true, response, "");
    } catch (error) {
        errorResponse(res, 400, err, err.message)
    }

})

//activation
auth.get('/activation/:token', async (req, res) => {
    try {

        let tokenSecret = process.env.TOKEN_SECRET_ACC
        const varification = jwt.verify(req.params.token, tokenSecret);
        let user= await users.findOne({
            _id: mongoType().ObjectId(varification.id)

        });
     
        if(user.isVerified) {
         return res.redirect('https://bigdigi.com.bd/login'); 
        }
        if (!varification) return errorResponse(res, 403, {}, "invalid authorization token");
        let check = await users.updateOne({
            _id: mongoType().ObjectId(varification.id)
        },
            {
                $set: {
                    isVerified: true,
                }
            }
        )
        if (check.n == 0 || check.nModified == 0) throw new Error('not modified')
        let httml = `<h1>Account hasbeen activated sucessfully</h1>
        <p>try to login to you account now</p>`
        // res.send(httml)
        res.redirect('https://bigdigi.com.bd/login'); 
        // successResponse(res, true, {}, "Activation sucessfull");
    } catch (error) {
        console.log(error);
        let httml = `<h1>Account activation has been failed</h1>
        <p>Try again with requisting new link </p>`
        res.send(httml)

    }

})

//resetpass
auth.post('/resetpassword/', async (req, res) => {
    try {

        let tokenSecret = process.env.TOKEN_SECRET1
        let token = req.header('resetpass')
        const varification = jwt.verify(token, tokenSecret);
        if (!varification) return errorResponse(res, 403, {}, "invalid token");
        const salt = await bcrypt.genSaltSync(10);
        const hashedPass = await bcrypt.hashSync(req.body.password, salt);
        let check = await users.updateOne({
            _id: mongoType().ObjectId(varification.id)

        },
            {
                $set: {
                    password: hashedPass,
                }
            }
        )
        if (check.n == 0 || check.nModified == 0) throw new Error('not modified')

        successResponse(res, true, {}, "Reset sucessfull");
    } catch (err) {
        errorResponse(res, 400, err, err.message)


    }

})

auth.post('/changepassword/',verify, async (req, res) => {
    try {
        const salt = await bcrypt.genSaltSync(10);
        const hashedPass = await bcrypt.hashSync(req.body.password, salt);
        let data= await users.findOne(
            {
                _id:mongoType().ObjectId(req.userId),
                isDisabled:false
            },{
                password:1
            }
        )
        let validPass = await bcrypt.compareSync(req.body.oldPassword, data.password);
        if (!validPass) throw new Error("Wrong Password")

        let check = await users.updateOne({
            _id: mongoType().ObjectId(req.userId),

        },
            {
                $set: {
                    password: hashedPass,
                }
            }
        )
        if (check.n == 0 || check.nModified == 0) throw new Error('not modified')

        successResponse(res, true, {}, "Reset sucessfull");
    } catch (err) {
        errorResponse(res, 400, err, err.message)


    }

})
module.exports = auth