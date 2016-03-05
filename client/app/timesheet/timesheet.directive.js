'use strict';

angular.module('stayApp')
  .directive('timesheet', function ($log, Timesheet, TimesheetDialog) {
    return {
      templateUrl: 'app/timesheet/timesheet.html',
      restrict: 'E',
      scope: {
        timesheet: '='
      },
      link: function (scope, element, attrs) {

        $log.debug(scope);

        return init();

        function init(){
          scope.isKnownProject = isKnownProject;
          scope.openProjectDialog = openProjectDialog;
          scope.deleteTask = deleteTask;
          scope.addRow = addRow;
        }


        function deleteTask($event, task, $index){
          $log.debug('deleteTask', task, $index);
        }

        function addRow(clientName, projectName){
          return Timesheet.addRowToProject(scope.timesheet.id, clientName, projectName);
        }

        function openProjectDialog($event){
          return TimesheetDialog.openProjectDialog($event);
        }

        function isKnownProject(projectName){
          //TODO get from shared
          return projectName !== 'PROJECT_UNKNOWN';
        }
      }
    };
  });
