'use strict';

angular.module('stayApp', [
  'stayApp.auth',
  'stayApp.constants',
  'ngCookies',
  'ngResource',
  'ngStorage',
  'angular-sortable-view',
  'ngSanitize',
  'ngMaterial',
  'btford.socket-io',
  'ui.router',
  'validation.match'
])
  .config(function($urlRouterProvider, $locationProvider, $mdThemingProvider) {

    $urlRouterProvider.otherwise('/timesheet/');

    $locationProvider.html5Mode(true);

    $mdThemingProvider.definePalette('amazingPaletteName', {
      '50': 'FFFFFF',
      '100': '0E589E',
      '200': '0E589E',
      '300': '0E589E',
      '400': '0E589E',
      '500': '0E589E',
      '600': '0E589E',
      '700': '0E589E',
      '800': '0E589E',
      '900': '0E589E',
      'A100': '0E589E',
      'A200': '0E589E',
      'A400': '0E589E',
      'A700': '0E589E',
      'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
                                          // on this palette should be dark or light
      'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
        '200', '300', '400', 'A100'],
      'contrastLightColors': undefined    // could also specify this if default was 'dark'
    });
    $mdThemingProvider.theme('default')
      .primaryPalette('amazingPaletteName')

  });
