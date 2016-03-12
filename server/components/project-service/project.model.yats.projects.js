'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var ProjectYatsSchema = new mongoose.Schema({
  clientId: {
    type: String,
    uniq: true
  },
  projects: [{
    id: String,
    name: String
  }]
},
{
  timestamps: true
});

export default mongoose.model('ProjectProjectsYats', ProjectYatsSchema);
