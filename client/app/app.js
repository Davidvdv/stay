'use strict';

angular.module('stayApp', [
  'stayApp.auth',
  'stayApp.constants',
  'ngCookies',
  'ngResource',
  'ngStorage',
  'ngSanitize',
  'ngMaterial',
  'btford.socket-io',
  'ui.router',
  'validation.match'
])
  .config(function($urlRouterProvider, $locationProvider) {

    $urlRouterProvider.otherwise('/timesheet/');

    $locationProvider.html5Mode(true);
  });
