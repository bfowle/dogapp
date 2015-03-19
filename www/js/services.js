var fb = null;

angular.module('dogapp.services', ['firebase'])
    .constant('FIREBASE_URL', 'https://dogapp.firebaseio.com/')
    .factory('authService', function($state, $firebaseAuth, userService, FIREBASE_URL) {
        fb = fb || new Firebase(FIREBASE_URL);
        var auth = $firebaseAuth(fb);

        auth.$onAuth(function(authData) {
            if (authData) {
                userService.uid(authData.uid);
                $state.go('case.list');
            } else {
                userService.uid(null);
                $state.go('auth.signin');
            }
        });

        return auth;
    })
    .factory('userService', function() {
        var service = {},
            uid;

        service.uid = function(u) {
            if (angular.isDefined(u)) {
                uid = u;
            }
            return uid;
        };

        service.fetchUser = function() {
            return fb.child('users/' + uid);
        };

        return service;
    })
    .factory('caseService', function($firebaseArray) {
        return $firebaseArray.$extend({
            completed: function(flag) {
                return this.$list.filter(function(item) {
                    return item.isCompleted === flag;
                });
            }
        });
    })
    .factory('notifyService', function($rootScope, $ionicLoading) {
        var service = {};

        service.show = function(text) {
            $rootScope.loading = $ionicLoading.show({
                template: '<ion-spinner></ion-spinner><div>' + (text ? text : 'Loading...') + '</div>'
            });
        };

        service.hide = function() {
            $ionicLoading.hide();
        };

        service.notify = function(text) {
            service.show(text);

            setTimeout(function() {
                service.hide();
            }, 2000);
        };

        return service;
    });
