'use strict';

angular.module('stayApp')
  .directive('timesheetNavigation', function ($log, $state, $stateParams) {
    return {
      templateUrl: 'app/timesheet-navigation/timesheet-navigation.html',
      restrict: 'E',
      replace: true,
      scope: {
        timesheets: '='
      },
      link: function (scope, element, attrs) {

        return init();

        function init(){
          scope.isTimesheetActive = isTimesheetActive;
          scope.gotoTimesheet = gotoTimesheet;
          scope.getTimesheetLabel = getTimesheetLabel;
        }

        function isTimesheetActive(timesheet){
          return $stateParams.id === timesheet.id;
        }

        function gotoTimesheet(timesheet){
          $log.debug('gotoTimesheet', timesheet);
          $state.go('main.timesheet', { id: timesheet.id });
        }

        function getTimesheetLabel(timesheet){
          return moment(timesheet.endDate).format('DD/MM/YYYY') + ' : '+ timesheet.endDatePretty;
        }
      }
    };
  });
