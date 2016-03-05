(function(angular, undefined) {
'use strict';

angular.module('stayApp.constants', [])

.constant('appConfig', {userRoles:['guest','user','admin'],sideNavId:'left-nav'})

;
})(angular);