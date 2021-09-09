const mongoose = require('mongoose');
require('dotenv/config');

module.exports = {
  connect: () => connect(),
  mongoType: () => mongoose.Types,
  startSession: () => startSession()
};

async function connect() {
  
  if (mongoose.connection.readyState === 0) {
    return await mongoose.connect(process.env.DB_CONECTIONSTRING, {
      useNewUrlParser: true
    },(err)=>{if(err)console.log(err)
      else console.log("conected");});
  } else return true;
}
async function startSession() {
  return await mongoose.startSession();
}
