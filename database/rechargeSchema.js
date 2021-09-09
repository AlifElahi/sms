const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-beautiful-unique-validation');
const rechargeSchema = new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  type: {
    type: String,
    required: true
    // unique: true
  },
  uId: {
    type: String,
    required: true,
    // unique: true
  },
  amount: {
    type: Number,
    required: true,
    // unique: true
  },
  trancationId: {
    type: String,
    required: true,
    // unique: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  isDisabled: {
    type: Boolean,
    required: true,
    default:false
  }
});
rechargeSchema.plugin(uniqueValidator);
const recharge = mongoose.model('recharge', rechargeSchema);
module.exports = recharge;
