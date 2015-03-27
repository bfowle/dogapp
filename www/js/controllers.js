'use strict';

angular.module('dogapp.controllers', ['dogapp.services'])
    .controller('SignInCtrl', function($state, $cordovaOauth, authService, userService, notifyService) {
        var vm = this;

        vm.validateUser = function() {
            notifyService.show('Please wait... Authenticating');

            var OAUTH2_CLIENT_ID = '599376156128-1i8b4kdki9v9tll8m5akbih9tu4g1hkc.apps.googleusercontent.com',
                OAUTH2_SCOPES = ['https://www.googleapis.com/auth/plus.me'/*, 'https://www.googleapis.com/auth/youtube'*/];

            $cordovaOauth.google(OAUTH2_CLIENT_ID, OAUTH2_SCOPES)
                .then(function(result) {
                    authService.$authWithOAuthToken('google', result.access_token)
                        .then(function(auth) {
                            userService.uid(auth.uid);
                        })
                        .catch(function(error) {
                            console.error('ERROR: ' + error);
                        });
                }, function(error) {
                    console.log(error);
                });

            //authService.$authWithOAuthPopup('google')
            //    .then(function(auth) {
            //        userService.uid(auth.uid);
            //    })
            //    .catch(function(error) {
            //        console.error('ERROR: ' + error);
            //    });
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
    .controller('CaseCreateCtrl', function($scope, $ionicHistory, $cordovaCamera, $firebaseArray, userService,
                                           notifyService, recorderService) {
        var vm = this;

        vm.data = {
            item: '',
            image: null
        };

        vm.showRecorder = false;

        $ionicHistory.clearHistory();

        $scope.$on('modal.shown', function() {
            vm.showRecorder = true;
        });

        vm.close = function() {
            $scope.modal.hide();
        };

        vm.recordSuccess = function(record) {
            vm.audioTrack = record.audioUrl.replace('data:audio/wav;base64,', '');
            vm.videoTrack = record.videoUrl.replace('data:video/webm;base64,', '');
        };

        vm.recordError = function(err) {
            console.log(err.message);
        };

        vm.snapSuccess = function(image) {
            vm.data.image = image.replace(/data\:image\/(png|jpeg);base64,/g, '');
            vm.showRecorder = false;
        };

        vm.snapRetake = function() {
            vm.data.image = null;
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
