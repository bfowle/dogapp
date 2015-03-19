angular.module('dogapp', [
        'ionic',
        'ngCordova',
        'firebase',
        'dogapp.controllers',
        'dogapp.directives',
        'dogapp.services'
    ])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('auth', {
                url: '/auth',
                abstract: true,
                templateUrl: 'templates/auth-tabs.html',
                resolve: {
                    'currentAuth': ['authService', function(authService) {
                        return authService.$waitForAuth();
                    }]
                }
            })
            .state('auth.signin', {
                url: '/signin',
                views: {
                    'auth-signin': {
                        templateUrl: 'templates/auth-signin.html',
                        controller: 'SignInCtrl as signin'
                    }
                }
            })
            .state('auth.register', {
                url: '/register',
                views: {
                    'auth-register': {
                        templateUrl: 'templates/auth-register.html',
                        controller: 'RegisterCtrl as register'
                    }
                }
            })
            .state('case', {
                url: '/case',
                abstract: true,
                templateUrl: 'templates/case-tabs.html',
                resolve: {
                    'currentAuth': ['authService', function(authService) {
                        return authService.$requireAuth();
                    }]
                }
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
            .state('case.completed', {
                url: '/completed',
                views: {
                    'case-completed': {
                        templateUrl: 'templates/case-completed.html',
                        controller: 'CaseCompletedCtrl as complete'
                    }
                }
            });

        $urlRouterProvider.otherwise('/auth/signin');
    })
    .run(function($rootScope, $state, $ionicPlatform, $ionicHistory, authService, FIREBASE_URL) {
        $ionicPlatform.ready(function() {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            //$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
            //    if (error === 'AUTH_REQUIRED') {
            //        $state.go('auth.signin');
            //    }
            //});

            $rootScope.hasHistory = function() {
                return $ionicHistory.backView() !== null;
            };

            $rootScope.logout = function() {
                authService.$unauth();
            };
        });
    });
