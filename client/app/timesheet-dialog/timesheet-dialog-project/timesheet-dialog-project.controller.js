'use strict';

angular.module('stayApp')
  .controller('TimesheetDialogProjectCtrl', function ($scope, $log, $mdDialog, Timesheet) {

    return init();

    /**
     *
     */
    function init(){

      $scope.closeDialog = closeDialog;
      $scope.searchProjects = Timesheet.searchProjects;
      $scope.searchClients = Timesheet.searchClients;
      $scope.searchProjectsText = '';
      $scope.searchClientsText = '';

    }

    /**
     *
     */
    function closeDialog(){
      return $mdDialog.close();
    }


  });
