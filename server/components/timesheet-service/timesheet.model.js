'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var TimesheetSchema = new mongoose.Schema({
  name: String,
  info: String,
  active: Boolean
});

export default mongoose.model('Timesheet', TimesheetSchema);
