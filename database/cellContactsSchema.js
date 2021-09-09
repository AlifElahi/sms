const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-beautiful-unique-validation');
const cellSchema = new mongoose.Schema({
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
  cell: {
    type: String,
    unique: true,
    required:true
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
cellSchema.plugin(uniqueValidator);
const cell = mongoose.model('cell', cellSchema);
module.exports = cell;
