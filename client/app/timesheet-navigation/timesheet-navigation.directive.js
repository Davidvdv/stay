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
          scope.getTimesheetDate = getTimesheetDate;
          scope.getTimesheetTimeframe = getTimesheetTimeframe;
        }

        function isTimesheetActive(timesheet){
          return $stateParams.id === timesheet.id;
        }

        function gotoTimesheet(timesheet){
          $log.debug('gotoTimesheet', timesheet);
          $state.go('main.timesheet', { id: timesheet.id });
        }

        function getTimesheetDate(timesheet){
          return moment(timesheet.endDate).format('DD/MM/YYYY');
        }

        function getTimesheetTimeframe(timesheet){
          return 'Due '+ moment(timesheet.endDate).fromNow();
        }
      }
    };
  });
