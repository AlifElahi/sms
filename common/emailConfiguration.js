const nodemailer = require("nodemailer");


module.exports = {
  getMailTransporter: () => getMailTransporter(),
};

 function getMailTransporter() {
  
    const transporter = nodemailer.createTransport({
        host: "server.hostingbangladesh.com",
        port: 587,
        auth: {
            user: 'marketing@bigdigi.com.bd', 
            pass: '{=0cc{RYJ@,P', 
        },
        logger: true
        
    });

      return transporter
   
}
