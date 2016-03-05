'use strict';

angular.module('stayApp')
  .service('TimesheetDialog', function ($mdDialog, $log, $timeout) {


    this.dialogActive = false;



    this.openProjectDialog = ($event) => {
      return this.openDialog('TimesheetDialogProjectCtrl', 'app/timesheet-dialog/timesheet-dialog-project/timesheet-dialog-project.html', $event);
    };

    this.openDialog = (controllerName, templateName, $event = {}) => {
      if( ! this.dialogActive){
        this.dialogActive = true;
        return $mdDialog.show({
          controller: controllerName,
          templateUrl: templateName,
          parent: angular.element(document.body),
          targetEvent: $event,
          clickOutsideToClose: true
        })
          .then(accepted => {
            $log.debug('dialog action accepted', accepted);
            this.dialogActive = false;
            return accepted;
          },
          () => {
            $log.debug('dialog action cancelled');
            this.dialogActive = false;
          });
      }
      else {
        throw new Error('Dialog already opened');
      }
    };



  });
