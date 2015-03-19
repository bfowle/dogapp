angular.module('dogapp.directives', [])
    .directive('thumbnailView', function() {
        return {
            restrict: 'E',
            scope: {
                image: '='
            },
            controller: function($scope, $element, $timeout) {
                $timeout(function() {
                    var el = $element[0],
                        img,
                        imgEl,
                        container,
                        containerEl;

                    // add a container element
                    $element.append('<div class="img-preview"></div>');
                    container = angular.element(el.querySelector('.img-preview'));
                    containerEl = container[0];

                    // add an image element
                    $element.append('<img />');
                    img = $element.find('img');
                    imgEl = img[0];
                    imgEl.src = 'data:image/jpeg;base64,' + $scope.image;

                    // set the img element inside container
                    containerEl.appendChild(imgEl);

                    if ((imgEl.offsetWidth / imgEl.offsetHeight) < 1) {
                        img.addClass('portrait');
                    }
                });
            }
        };
    });
