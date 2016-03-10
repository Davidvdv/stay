'use strict';

describe('Service: timesheet', function () {

  // load the service's module
  beforeEach(module('stayApp'));

  // instantiate service
  var timesheet;
  beforeEach(inject(function (_timesheet_) {
    timesheet = _timesheet_;
  }));

  it('should do something', function () {
    !!timesheet.should.be.true;
  });

});
