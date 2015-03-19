angular.module('dogapp.controllers', ['dogapp.services'])
    .controller('RegisterCtrl', function($rootScope, $scope, $state, authService, userService, notifyService) {
        $scope.user = {
            email: '',
            password: ''
        };

        $scope.createUser = function() {
            notifyService.show('Please wait... Registering');

            if (!$scope.user.email || !$scope.user.password) {
                notifyService.notify('Please enter valid credentials');
                return false;
            }

            authService.$createUser($scope.user)
                .then(function(user) {
                    var usersRef = fb.child('users/' + user.uid);
                    usersRef.set({
                        email: $scope.user.email,
                        created: Date.now(),
                        updated: Date.now()
                    });

                    return authService.$authWithPassword($scope.user);
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
    .controller('SignInCtrl', function($rootScope, $scope, $state, authService, userService, notifyService) {
        $scope.user = {
            email: '',
            password: ''
        };

        $scope.validateUser = function() {
            notifyService.show('Please wait... Authenticating');

            if (!$scope.user.email || !$scope.user.password) {
                notifyService.notify('Please enter valid credentials');
                return false;
            }

            authService.$authWithPassword($scope.user)
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
    .controller('CaseListCtrl', function($rootScope, $scope, $filter, $ionicModal, caseService, userService, notifyService) {
        notifyService.show('Please wait... Processing');

        var ref = fb.child('cases')
            .orderByChild('uid')
            .equalTo(userService.uid());

        $scope.list = new caseService(ref);
        $scope.list.$loaded(function() {
            notifyService.hide();
        });

        $ionicModal.fromTemplateUrl('templates/case-create.html', function(modal) {
            $scope.newTemplate = modal;
        });

        $scope.newTask = function() {
            $scope.newTemplate.show();
        };

        $scope.markCompleted = function(key) {
            notifyService.show('Please wait... Updating List');

            var item = $scope.list.$getRecord(key);
            item.isCompleted = true;
            item.updated = Date.now();

            $scope.list.$save(item)
                .then(function() {
                    notifyService.hide();
                    notifyService.notify('Successfully updated');
                }, function(error) {
                    notifyService.hide();
                    notifyService.notify('Oops! something went wrong. Try again later');
                });
        };

        $scope.deleteItem = function(key) {
            notifyService.show('Please wait... Deleting from List');

            var item = $scope.list.$getRecord(key);
            $scope.list.$remove(item)
                .then(function() {
                    notifyService.hide();
                    notifyService.notify('Successfully deleted');
                }, function(error) {
                    notifyService.hide();
                    notifyService.notify('Oops! something went wrong. Try again later');
                });
        };
    })
    .controller('CaseCreateCtrl', function($rootScope, $scope, $ionicHistory, $cordovaCamera, $firebaseArray, userService, notifyService) {
        $scope.data = {
            item: '',
            image: null
        };

        $ionicHistory.clearHistory();

        $scope.close = function() {
            $scope.modal.hide();
        };

        $scope.uploadImage = function() {
            var options = {
                quality: 90,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                correctOrientation: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 800,
                targetHeight: 600,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false
            };

            $cordovaCamera.getPicture(options)
                .then(function(imageData) {
                    $scope.data.image = imageData;
                    $cordovaCamera.cleanup();
                })
                .catch(function(error) {
                    console.error(error);
                });
        };

        $scope.createNew = function() {
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

            $scope.data = {
                item: '',
                image: null
            };

            notifyService.hide();
        };
    })
    .controller('CaseCompletedCtrl', function($rootScope, $scope, $filter, caseService, userService, notifyService) {
        notifyService.show('Please wait... Processing');

        var ref = fb.child('cases')
            .orderByChild('uid')
            .equalTo(userService.uid());

        $scope.list = new caseService(ref);
        $scope.list.$loaded(function() {
            notifyService.hide();
        });

        $scope.deleteItem = function(key) {
            notifyService.show('Please wait... Deleting from List');

            var item = $scope.list.$getRecord(key);
            $scope.list.$remove(item)
                .then(function() {
                    notifyService.hide();
                    notifyService.notify('Successfully deleted');
                }, function(error) {
                    notifyService.hide();
                    notifyService.notify('Oops! something went wrong. Try again later');
                });
        };
    });
