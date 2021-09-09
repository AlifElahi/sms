const express = require("express");
const app = express();
var cors = require('cors')
const { connect } = require("./database/db_conections");
connect();
const smsRoute = require("./routes/sms");
const emailRoute = require("./routes/email");
const historyRoute = require("./routes/history");
const authRoute = require("./routes/auth");
const dashBoardRoute = require("./routes/dash");
const contactsRoute = require("./routes/contacts");
const rechargeRoute = require("./routes/recharge");
const adminrouter = require("./routes/admin");
const port = process.env.PORT || 4000
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const {getMailTransporter}=require("./common/emailConfiguration")
const transporter=getMailTransporter();
const options = {
    swaggerDefinition: {
        info: {
            title: "BIG DIGI API",
            version: '1.0.0',
            description: 'BigDigi by AEK'
        },
        servers:['https://smspathao.herokuapp.com/']
    },
    apis:['./routes/*.js']
}

const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors())
app.use(express.json())
app.use("/sms", smsRoute);
app.use("/email", emailRoute);
app.use("/admin", adminrouter);
app.use("/auth", authRoute); 
app.use("/recharge", rechargeRoute);
app.use("/contacts", contactsRoute);
app.use("/history", historyRoute);
app.use("/dashboard", dashBoardRoute);
app.get('/', async (req, res) => {
    res.send(`BIGDIGI SERVER IS UP & RUNING on port ${port}`)
})
app.get('/fail', async (req, res) => {

    res.send(data)
})
app.listen(port, () => { console.log(`server running at ${port}`); })



