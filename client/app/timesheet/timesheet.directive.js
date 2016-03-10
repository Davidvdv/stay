'use strict';

angular.module('stayApp')
  .directive('timesheet', function ($log, Timesheet, TimesheetDialog, $timeout) {
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
          scope.getProjectNameDisplay = getProjectNameDisplay
          scope.getClientNameDisplay = getClientNameDisplay;
          scope.isKnownProject = isKnownProject;
          scope.openProjectMoveDialog = openProjectMoveDialog;
          scope.openTaskMoveDialog = openTaskMoveDialog;
          scope.deleteTask = deleteTask;
          scope.addRow = addRow;
          scope.getTaskTotal = getTaskTotal;
          scope.svElementOpts = { containment: '#timesheet-content' };

          scope.setupTotalWatcher = setupTotalTaskWatcher;

          $timeout(() => {scope.isLoaded = true;})
        };


        function setupTotalTaskWatcher(task){
          scope.$watch(task, () => {
            task.total = getTaskTotal(task);
          });
        }

        function deleteTask($event, timesheet, taskIndex, clientName, projectName){
          $log.debug('deleteTask', timesheet, taskIndex, clientName, projectName);
          return Timesheet.deleteTask(timesheet, taskIndex, clientName, projectName);
        }

        function addRow(clientName, projectName){
          return Timesheet.addRowToProject(scope.timesheet.id, clientName, projectName);
        }

        function getTaskTotal(task){
          return task.total = getTaskNumber(task.mon) + getTaskNumber(task.tue) + getTaskNumber(task.wed) + getTaskNumber(task.thu)
            + getTaskNumber(task.fri) + getTaskNumber(task.sat) + getTaskNumber(task.sun);
        }

        function getTaskNumber(day){
          return typeof day === 'number' ? day : (isNaN(parseInt(day)) ? 0 : parseInt(day) );
        }

        function openProjectMoveDialog($event){
          return TimesheetDialog.openProjectDialog($event)
            .then(accepted => {
              if (accepted) {

              }
            });
        }

        function openTaskMoveDialog($event, timesheet, taskIndex, clientName, projectName){
          return TimesheetDialog.openProjectDialog($event)
            .then(accepted => {
              if(accepted){
                return Timesheet.moveTimesheetTask(taskIndex, timesheet, clientName, projectName, accepted.clientItem, accepted.projectItem);
              }
            });
        }

        function getClientNameDisplay(clientName){
          return clientName === 'CLIENT_UNKNOWN' ? 'Unknown' : clientName;
        }

        function getProjectNameDisplay(projectName){
          return projectName === 'PROJECT_UNKNOWN' ? 'Unknown' : projectName;
        }

        function isKnownProject(projectName){
          //TODO get from shared
          return projectName !== 'PROJECT_UNKNOWN';
        }
      }
    };
  });
