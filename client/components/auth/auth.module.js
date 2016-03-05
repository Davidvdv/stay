'use strict';

angular.module('stayApp.auth', [
  'stayApp.constants',
  'stayApp.util',
  'ngCookies',
  'ui.router'
])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
