'use strict';

angular.module('stayApp')
  .controller('TimesheetDialogProjectCtrl', function ($scope, $log, $mdDialog, Timesheet) {

    return init();

    /**
     *
     */
    function init(){

      $scope.complete = complete;
      $scope.selectedClientItemChange = selectedClientItemChange;
      $scope.closeDialog = closeDialog;
      $scope.searchProjects = Timesheet.searchProjects;
      $scope.searchClients = Timesheet.searchClients;
      $scope.searchProjectsText = '';
      $scope.searchClientsText = '';

    }

    function closeDialog(){
      return $mdDialog.close();
    }

    function selectedClientItemChange(clientItem){
      return $scope.searchProjects(clientItem, '');
    }

    function complete($event, clientItem, projectItem){
      return $mdDialog.hide({clientItem, projectItem});
    }


  });
