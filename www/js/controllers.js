'use strict';

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

angular.module('dogapp.controllers', ['dogapp.services'])
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

        //vm.list = caseService;

        $ionicModal.fromTemplateUrl('templates/case-create.html', function(modal) {
            vm.newTemplate = modal;
        });

        vm.newTask = function() {
            vm.newTemplate.show();
        };

        vm.markCompleted = function(key) {
            notifyService.show('Please wait... Updating List');

            var item = vm.list.$getRecord(key);
            //var item = vm.list.getCase(key);
            item.isCompleted = true;
            item.updated = Date.now();

            notifyService.hide();

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

            //caseService.deleteCase(key);
            //notifyService.hide();

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
    .controller('CaseDetailCtrl', function($state, $sce, $firebaseObject, caseService, userService, notifyService) {
        var vm = this;

        notifyService.show('Please wait... Processing');

        var ref = fb.child('cases/' + $state.params.id);

        var item = $firebaseObject(ref);
        item.$loaded(function(obj) {
            vm.item = obj;
            vm.item.videoUrl = $sce.trustAsResourceUrl(vm.item.video) || '';
            notifyService.hide();
        });

        vm.markCompleted = function(key) {
            notifyService.show('Please wait... Updating List');

            var item = vm.list.$getRecord(key);
            //var item = vm.list.getCase(key);
            item.isCompleted = true;
            item.updated = Date.now();

            notifyService.hide();

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

            //caseService.deleteCase(key);
            //notifyService.hide();

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
                                           userService, caseService, notifyService, recorderService) {
        var vm = this;

        vm.data = {
            item: '',
            image: null,
            video: null
        };

        vm.showRecorder = false;

        $ionicHistory.clearHistory();

        //var OAUTH2_CLIENT_ID = '599376156128-1i8b4kdki9v9tll8m5akbih9tu4g1hkc.apps.googleusercontent.com',
        //    OAUTH2_SCOPES = ['https://www.googleapis.com/auth/youtube'];

        //$cordovaOauth.google(OAUTH2_CLIENT_ID, OAUTH2_SCOPES)
        //    .then(function(result) {
        //        console.log(JSON.stringify(result));
        //    }, function(error) {
        //        console.log(error);
        //    });

        $scope.$on('modal.shown', function() {
            vm.showRecorder = true;
        });

        vm.close = function() {
            $scope.modal.hide();
        };

        vm.recordSuccess = function(data) {
            //vm.audioTrack = record.audioUrl.replace('data:audio/wav;base64,','');
            //vm.videoTrack = record.videoUrl.replace('data:video/webm;base64,','');
            vm.data.video = data;
        };

        vm.recordError = function(err) {
            console.log(err.message);
        };

        //vm.snapSuccess = function(data) {
        //    vm.data.image = data.replace(/data:image\/(png|jpeg);base64,/g, '');
        //    vm.showRecorder = false;
        //};

        vm.createNew = function() {
            var item = vm.data.item,
                image = vm.data.image,
                video = vm.data.video;

            if (!item) return;

            $scope.modal.hide();
            notifyService.show('Please wait... Creating new');

            var data = {
                uid: userService.uid(),
                item: item,
                image: image,
                video: video,
                isCompleted: false,
                created: Date.now(),
                updated: Date.now()
            };

            var casesRef = fb.child('cases');
            casesRef.push(data);

            //caseService.addCase({
            //    $id: guid(),
            //    item: item,
            //    image: image,
            //    video: video,
            //    isCompleted: false,
            //    created: Date.now(),
            //    updated: Date.now()
            //});

            vm.data = {
                item: '',
                image: null,
                video: null
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

        //vm.list = caseService;

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
