'use strict';

angular.module('stayApp')
  .controller('TimesheetDialogProjectCtrl', function ($scope, $log, $mdDialog, Timesheet, Projects) {

    return init();

    /**
     *
     */
    function init(){

      $scope.complete = complete;
      $scope.selectedClientItemChange = selectedClientItemChange;
      $scope.closeDialog = closeDialog;
      $scope.searchProjects = Projects.searchProjects;
      $scope.searchClients = Projects.searchClients;
      $scope.selectCommon = selectCommon;

      $scope.noCache = true;

      $scope.searchProjectsText = '';
      $scope.searchClientsText = '';
      Projects.getCommon().then((commonProjects = []) => {
        $scope.commonProjects = _.take(commonProjects, 9);
      });

    }

    function selectCommon($event, commonProject){
      return complete($event, {name: commonProject.clientName}, {name: commonProject.projectName});
    }

    function closeDialog(){
      return $mdDialog.close();
    }

    function selectedClientItemChange(clientItem){
      $scope.searchProjectsText = '';
      return $scope.searchProjects(clientItem, '');
    }

    function complete($event, clientItem = {}, projectItem = {}){
      if( ! clientItem.name || ! projectItem.name){
        return;
      }
      else {
        return $mdDialog.hide({clientItem, projectItem});
      }
    }


  });
