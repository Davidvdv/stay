'use strict';




angular.module('stayApp')
  .directive('randomColor', ($timeout, $log) => ({
    restrict: 'A',
    link: (scope, element, attrs) => {

      return init();

      function init() {

        var colorSeed = attrs.randomColor;

        var randomColorOptions = {
          seed: colorSeed || ''
        };

        $timeout(() => {
          element.css(`background-color`, `${randomColor(randomColorOptions)}`);
        });
      }

    }

  }));
