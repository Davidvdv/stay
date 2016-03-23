'use strict';

angular.module('stayApp')
  .directive('timesheet', function ($log, Timesheet, TimesheetDialog, $timeout, Projects) {
    return {
      templateUrl: 'app/timesheet/timesheet.html',
      restrict: 'E',
      scope: {
        timesheet: '='
      },
      link: function (scope, element, attrs) {

        return init();

        function init(){

          scope.getProjectNameDisplay = getProjectNameDisplay;
          scope.getClientNameDisplay = getClientNameDisplay;
          scope.isKnownProject = isKnownProject;
          scope.openProjectMoveDialog = openProjectMoveDialog;
          scope.openTaskMoveDialog = openTaskMoveDialog;
          scope.deleteTask = deleteTask;
          scope.addRow = addRow;
          scope.getTaskTotal = getTaskTotal;
          scope.svElementOpts = { containment: '#timesheet-content' };
          scope.getActivitiesByTask = getActivitiesByTask;
          scope.getTasksByTask = getTasksByTask;

          scope.setupTotalWatcher = setupTotalTaskWatcher;

          $timeout(() => {scope.isLoaded = true;});

          //Make the total model based upon the sum of day totals
          _(scope.timesheet.rows).map(client => {
            _(client).map(projects => {
              _(projects).map(task => {
                task.total = () =>{
                  return task.mon + task.tue + task.wed + task.thu + task.fri + task.sat + task.sun;
                }
              }).value();
            }).value();
          }).value();
        }

        function getActivitiesByTask(task){
          return Projects.getActivitiesByRef(getTaskRef(task));
        }

        function getTasksByTask(task){
          return Projects.getTasksByRef(getTaskRef(task));
        }

        function getTaskRef(task){
          return task.clientId + task.projectId;
        }

        function setupTotalTaskWatcher(task){
          scope.$watch(task, () => {
            task.total = getTaskTotal(task);
          }, true);
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

        function openProjectMoveDialog($event, timesheet, tasks, clientName, projectName){
          return TimesheetDialog.openProjectDialog($event)
            .then(accepted => {
              if (accepted) {
                return _.forEach(tasks, (task, taskIndex) => {
                  return Timesheet.moveTimesheetTask(0, timesheet, clientName, projectName, accepted.clientItem, accepted.projectItem);
                });
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
