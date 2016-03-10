'use strict';




angular.module('stayApp')
  .directive('randomColor', ($timeout, $log) => ({
    restrict: 'A',
    link: (scope, element, attrs) => {

      return init();

      function init() {

        var colorSeed = attrs.randomColor;

        var randomColorOptions = {
          seed: colorSeed || '',
          luminosity: 'light'
        };

        $timeout(() => {
          element.css(`color`, `${randomColor(randomColorOptions)}`);
          element.css(`background-color`, `${randomColor(randomColorOptions)}`);
        });
      }

    }

  }));
