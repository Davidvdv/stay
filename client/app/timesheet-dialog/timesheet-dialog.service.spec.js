'use strict';

describe('Service: timesheetDialog', function () {

  // load the service's module
  beforeEach(module('stayApp'));

  // instantiate service
  var timesheetDialog;
  beforeEach(inject(function (_timesheetDialog_) {
    timesheetDialog = _timesheetDialog_;
  }));

  it('should do something', function () {
    !!timesheetDialog.should.be.true;
  });

});
