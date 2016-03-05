'use strict';

angular.module('stayApp')
  .service('TimesheetDialog', function ($mdDialog, $log, $timeout) {


    this.dialogActive = false;



    this.openProjectDialog = ($event) => {
      return this.openDialog('TimesheetDialogProjectCtrl', 'app/timesheet-dialog/timesheet-dialog-project/timesheet-dialog-project.html', $event);
    };

    //$timeout(this.openProjectDialog, 500)

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
          .then(() => {
            $log.debug('dialog action accepted');
            this.dialogActive = false;
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
