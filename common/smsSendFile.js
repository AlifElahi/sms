const axios = require('axios');

const smsConfig = {
    userName: "alifelahi",
    hashToken: "1cd124e7c8b031d2413c81679f5833c9"
}

module.exports.smsSend = async (message, numbers) =>{
    let messages = message;
    // messages = messages.toString("utf-8");
    let nums=numbers.toString()
    console.log("ppppp");
    let url = `http://alphasms.biz/index.php?app=ws&u=${smsConfig.userName}&h=${smsConfig.hashToken}&op=pv&to=${nums}&msg=${messages}`;
    url=encodeURI(url);
    console.log("url",url);

    let res = await axios.get(url)
    // console.log(res);
    return res



}