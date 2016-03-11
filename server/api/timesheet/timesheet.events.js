/**
 * Timesheet model events
 */

'use strict';

import {EventEmitter} from 'events';
var Timesheet = require('../../components/timesheet-service/timesheet.model');
var TimesheetEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
TimesheetEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Timesheet.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    TimesheetEvents.emit(event + ':' + doc._id, doc);
    TimesheetEvents.emit(event, doc);
  }
}

export default TimesheetEvents;
