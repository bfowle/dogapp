'use strict';

angular.module('dogapp.controllers', ['dogapp.services'])
    .controller('RegisterCtrl', function($state, authService, userService, notifyService) {
        var vm = this;

        vm.user = {
            email: '',
            password: ''
        };

        vm.createUser = function() {
            notifyService.show('Please wait... Registering');

            if (!vm.user.email || !vm.user.password) {
                notifyService.notify('Please enter valid credentials');
                return false;
            }

            authService.$createUser(vm.user)
                .then(function(user) {
                    var usersRef = fb.child('users/' + user.uid);
                    usersRef.set({
                        email: vm.user.email,
                        created: Date.now(),
                        updated: Date.now()
                    });

                    return authService.$authWithPassword(vm.user);
                })
                .then(function(auth) {
                    notifyService.hide();
                    userService.uid(auth.uid);
                    $state.go('case.list');
                })
                .catch(function(error) {
                    notifyService.notify(error);
                });
        }
    })
    .controller('SignInCtrl', function($state, authService, userService, notifyService) {
        var vm = this;

        vm.user = {
            email: '',
            password: ''
        };

        vm.validateUser = function() {
            notifyService.show('Please wait... Authenticating');

            if (!vm.user.email || !vm.user.password) {
                notifyService.notify('Please enter valid credentials');
                return false;
            }

            authService.$authWithPassword(vm.user)
                .then(function(auth) {
                    notifyService.hide();
                    userService.uid(auth.uid);
                    $state.go('case.list');
                })
                .catch(function(error) {
                    notifyService.hide();
                    console.error('ERROR: ' + error);
                });
        }
    })
    .controller('CaseListCtrl', function($ionicModal, caseService, userService, notifyService) {
        var vm = this;

        notifyService.show('Please wait... Processing');

        var ref = fb.child('cases')
            .orderByChild('uid')
            .equalTo(userService.uid());

        vm.list = new caseService(ref);
        vm.list.$loaded(function() {
            notifyService.hide();
        });

        $ionicModal.fromTemplateUrl('templates/case-create.html', function(modal) {
            vm.newTemplate = modal;
        });

        vm.newTask = function() {
            vm.newTemplate.show();
        };

        vm.markCompleted = function(key) {
            notifyService.show('Please wait... Updating List');

            var item = vm.list.$getRecord(key);
            item.isCompleted = true;
            item.updated = Date.now();

            vm.list.$save(item)
                .then(function() {
                    notifyService.hide();
                    notifyService.notify('Successfully updated');
                }, function(error) {
                    notifyService.hide();
                    notifyService.notify('Oops! something went wrong. Try again later');
                });
        };

        vm.deleteItem = function(key) {
            notifyService.show('Please wait... Deleting from List');

            var item = vm.list.$getRecord(key);
            vm.list.$remove(item)
                .then(function() {
                    notifyService.hide();
                    notifyService.notify('Successfully deleted');
                }, function(error) {
                    notifyService.hide();
                    notifyService.notify('Oops! something went wrong. Try again later');
                });
        };
    })
    .controller('CaseCreateCtrl', function($scope, $ionicHistory, $cordovaCamera, $cordovaOauth, $firebaseArray,
                                           userService, notifyService, recorderService) {
        var vm = this;

        vm.data = {
            item: '',
            image: null
        };

        vm.showRecorder = false;

        $ionicHistory.clearHistory();

        var OAUTH2_CLIENT_ID = '599376156128-1i8b4kdki9v9tll8m5akbih9tu4g1hkc.apps.googleusercontent.com',
            OAUTH2_SCOPES = ['https://www.googleapis.com/auth/youtube'];

        $cordovaOauth.google(OAUTH2_CLIENT_ID, OAUTH2_SCOPES)
            .then(function(result) {
                console.log(JSON.stringify(result));
            }, function(error) {
                console.log(error);
            });

        $scope.$on('modal.shown', function() {
            vm.showRecorder = true;
        });

        vm.close = function() {
            $scope.modal.hide();
        };

        vm.recordSuccess = function(record) {
            vm.audioTrack = record.audioUrl.replace('data:audio/wav;base64,','');
            vm.videoTrack = record.videoUrl.replace('data:video/webm;base64,','');
        };

        vm.recordError = function(err) {
            console.log(err.message);
        };

        vm.createNew = function() {
            var item = this.data.item,
                image = this.data.image;

            if (!item) return;

            $scope.modal.hide();
            notifyService.show('Please wait... Creating new');

            var data = {
                uid: userService.uid(),
                item: item,
                image: image,
                isCompleted: false,
                created: Date.now(),
                updated: Date.now()
            };

            var casesRef = fb.child('cases');
            casesRef.push(data);

            vm.data = {
                item: '',
                image: null
            };

            notifyService.hide();
        };
    })
    .controller('CaseCompletedCtrl', function(caseService, userService, notifyService) {
        var vm = this;

        notifyService.show('Please wait... Processing');

        var ref = fb.child('cases')
            .orderByChild('uid')
            .equalTo(userService.uid());

        vm.list = new caseService(ref);
        vm.list.$loaded(function() {
            notifyService.hide();
        });

        vm.deleteItem = function(key) {
            notifyService.show('Please wait... Deleting from List');

            var item = vm.list.$getRecord(key);
            vm.list.$remove(item)
                .then(function() {
                    notifyService.hide();
                    notifyService.notify('Successfully deleted');
                }, function(error) {
                    notifyService.hide();
                    notifyService.notify('Oops! something went wrong. Try again later');
                });
        };
    });
