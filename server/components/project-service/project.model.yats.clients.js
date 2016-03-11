'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var ProjectClientsYatsSchema = new mongoose.Schema({
  timesheetId: {
    type: String,
    uniq: true
  },
  clients: [{
    id: String,
    name: String
  }],
  body: String
},
{
  timestamps: true
});

export default mongoose.model('ProjectClientsYats', ProjectClientsYatsSchema);
