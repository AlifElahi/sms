const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-beautiful-unique-validation');
const emailSchema = new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  profession: {
    type: String
  },
  location: {
    type: String
  },
  name: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    required: true,
    default:Date.now(),
  },
  createdBy: {
    type: String,
    required: true
  },
  isDisabled: {
    type: Boolean,
    required: true,
    default:false
  }
});
emailSchema.plugin(uniqueValidator);
const emails = mongoose.model('email', emailSchema);
module.exports = emails;
