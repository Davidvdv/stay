'use strict';

angular.module('stayApp')
  .controller('TimesheetDialogProjectCtrl', function ($scope, $log, $mdDialog, Timesheet, Projects) {

    return init();

    /**
     *
     */
    function init(){

      $scope.complete = complete;
      $scope.completeOmni = completeOmni;
      $scope.selectedClientItemChange = selectedClientItemChange;
      $scope.closeDialog = closeDialog;
      $scope.searchProjects = Projects.searchProjects;
      $scope.searchClients = Projects.searchClients;
      $scope.omniSearch = Projects.omniSearch;
      $scope.selectCommon = selectCommon;
      $scope.getAvatarClientName = getAvatarClientName;

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

    function getAvatarClientName(clientName){
      return clientName.substring(0, 2);
    }

    function closeDialog(){
      return $mdDialog.close();
    }

    function selectedClientItemChange(clientItem){
      $scope.searchProjectsText = '';
      return $scope.searchProjects(clientItem, '');
    }

    function completeOmni($event, omniItem = {}){
      $log.debug('completeOmni', omniItem);
      return complete($event, {id: omniItem.clientId, name: omniItem.clientName}, {id: omniItem.projectId, name: omniItem.projectName});
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
