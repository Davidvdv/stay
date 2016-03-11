'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var ProjectLocalSchema = new mongoose.Schema({
  name: String,
  info: String,
  active: Boolean
},
{
  timestamps: true
});

export default mongoose.model('ProjectLocal', ProjectLocalSchema);
