'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var ProjectYatsSchema = new mongoose.Schema({
  projectId: String,
  body: String
},
{
  timestamps: true
});

export default mongoose.model('ProjectYats', ProjectYatsSchema);
