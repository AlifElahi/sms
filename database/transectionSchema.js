const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-beautiful-unique-validation');
const transactionSchema = new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  type: {
    type: String,
    required: true
    // unique: true
  },
  sentTo:{
    type: Array,
    required:true
  },
  uId: {
    type: String,
    required: true,
    // unique: true
  },
  unit: {
    type: Number,
    required: true,
    // unique: true
  },
  unitCost: {
    type: Number,
    required: true,
    // unique: true
  },
  
  totalCost: {
    type: Number,
    required: true,
    // unique: true
  },

  message: {
    type: String,
    required: true,
    // unique: true
  },
  isTest:{
    type: Boolean,
    required: true,
    default:false
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
transactionSchema.plugin(uniqueValidator);
const transac = mongoose.model('transac', transactionSchema);
module.exports = transac;
