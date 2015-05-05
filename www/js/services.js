var fb = null;

angular.module('dogapp.services', ['firebase'])
    .constant('FIREBASE_URL', 'https://dogapp.firebaseio.com/')
    .factory('authService', function($state, $firebaseAuth, userService, FIREBASE_URL) {
        fb = fb || new Firebase(FIREBASE_URL);
        var auth = $firebaseAuth(fb);

        auth.$onAuth(function(authData) {
            if (authData) {
                userService.uid(authData.uid);
                //$state.go('case.list');
            } else {
                userService.uid(null);
                //$state.go('auth.signin');
            }
        });

        return auth;
    })
    .factory('userService', function() {
        var service = {},
            uid = 'foo';

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
        //var service = {},
        //    cases = [];

        //service.getCases = function() {
        //    return cases;
        //};

        //service.getCase = function(id) {
        //    var i;
        //    for (i in cases) {
        //        if (cases[i].$id === id) {
        //            return cases[i];
        //        }
        //    }
        //};

        //service.addCase = function(item) {
        //    cases.push(item);
        //};

        //service.deleteCase = function(id) {
        //    var item = service.getCase(id);
        //    cases.splice(cases.indexOf(item), 1);
        //};

        //service.completed = function(flag) {
        //    return cases.filter(function(item) {
        //        return item.isCompleted === flag;
        //    });
        //};

        //return service;

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
