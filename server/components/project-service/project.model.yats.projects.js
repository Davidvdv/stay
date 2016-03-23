'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var ProjectYatsSchema = new mongoose.Schema({
  clientId: {
    type: String,
    unique: true
  },
  projects: [{
    id: String,
    name: String,
    tasks: [{
      id: String,
      name: String
    }],
    activities: [{
      id: String,
      name: String
    }]
  }]
},
{
  timestamps: true
});

export default mongoose.model('ProjectProjectsYats', ProjectYatsSchema);
