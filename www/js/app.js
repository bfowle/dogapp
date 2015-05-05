angular.module('dogapp', [
        'ionic',
        'ngCordova',
        'firebase',
        'dogapp.controllers',
        'dogapp.directives',
        'dogapp.services',
        'dogapp.recorder'
    ])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            //.state('auth', {
            //    url: '/auth',
            //    abstract: true,
            //    templateUrl: 'templates/auth-tabs.html',
            //    resolve: {
            //        'currentAuth': ['authService', function(authService) {
            //            return authService.$waitForAuth();
            //        }]
            //    }
            //})
            //.state('auth.signin', {
            //    url: '/signin',
            //    views: {
            //        'auth-signin': {
            //            templateUrl: 'templates/auth-signin.html',
            //            controller: 'SignInCtrl as signin'
            //        }
            //    }
            //})
            .state('case', {
                url: '/case',
                abstract: true,
                templateUrl: 'templates/case-tabs.html',
                //resolve: {
                //    'currentAuth': ['authService', function(authService) {
                //        return authService.$requireAuth();
                //    }]
                //}
            })
            .state('case.list', {
                url: '/list',
                views: {
                    'case-list': {
                        templateUrl: 'templates/case-list.html',
                        controller: 'CaseListCtrl as case'
                    }
                }
            })
            .state('case.detail', {
                url: '/detail/:id',
                views: {
                    'case-list': {
                        templateUrl: 'templates/case-detail.html',
                        controller: 'CaseDetailCtrl as case'
                    }
                }
            })
            .state('case.completed', {
                url: '/completed',
                views: {
                    'case-completed': {
                        templateUrl: 'templates/case-completed.html',
                        controller: 'CaseCompletedCtrl as complete'
                    }
                }
            });

        $urlRouterProvider.otherwise('/case/list');
    })
    .run(function($rootScope, $state, $ionicPlatform, $ionicHistory, authService, userService, FIREBASE_URL) {
        $ionicPlatform.ready(function() {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            $rootScope.hasHistory = function() {
                return $ionicHistory.backView() !== null;
            };

            //$rootScope.logout = function() {
            //    authService.$unauth();
            //};
        });
    });
