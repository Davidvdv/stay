'use strict';

describe('Directive: timesheetNavigation', function () {

  // load the directive's module and view
  beforeEach(module('stayApp'));
  beforeEach(module('app/timesheet-navigation/timesheet-navigation.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<timesheet-navigation></timesheet-navigation>');
    element = $compile(element)(scope);
    scope.$apply();
    element.text().should.equal('this is the timesheetNavigation directive');
  }));
});
