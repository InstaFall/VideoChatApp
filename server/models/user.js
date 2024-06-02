const mongoose = require('mongoose');

const uniqueValidator = require('mongoose-unique-validator');

const schema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    minlength: 6,
  },
  fullName: {
    type: String,
    required: true,
    minlength: 3,
  },
  callerId: {
    type: String,
    unique: true,
    default: () => Math.floor(10000 + Math.random() * 90000).toString(),
  },
});

schema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

schema.plugin(uniqueValidator);

module.exports = mongoose.model('User', schema);
