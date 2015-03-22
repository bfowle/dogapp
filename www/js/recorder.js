'use strict';

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

angular.module('dogapp.recorder', [])
    .factory('recorderService', function($q, $window) {
        var record,
            meta;

        var Record = function(stream) {
            var self = this;

            this.video = $window.RecordRTC(stream, {type: 'video'});

            this.audio = $window.RecordRTC(stream, {
                onAudioProcessStarted: function() {
                    self.video.startRecording();
                }
            });
        };

        Record.prototype.getAudioUrl = function() {
            var deferred = $q.defer(),
                self = this;
            this.audio.stopRecording(function() {
                self.audio.getDataURL(function(dataURL) {
                    deferred.resolve(dataURL);
                });
            });
            return deferred.promise;
        };

        Record.prototype.getVideoUrl = function() {
            var deferred = $q.defer(),
                self = this;
            this.video.stopRecording(function() {
                self.video.getDataURL(function(dataURL) {
                    deferred.resolve(dataURL);
                });
            });
            return deferred.promise;
        };

        return {
            start: function(stream) {
                record = new Record(stream);
                return $window.URL.createObjectURL(stream);
            },
            stop: function() {
                var deferred = $q.defer();
                var self = this;
                $q.all([record.getAudioUrl(), record.getVideoUrl()])
                    .then(function(data) {
                        record.audioUrl = data[0];
                        record.videoUrl = data[1];
                        deferred.resolve(record);
                    });
                return deferred.promise;
            },
            record: function() {
                record.audio.startRecording();
            },
            setMeta: function(metaData) {
                meta = metaData;
            }
        };
    })
    .directive('recorder', function(recorderService) {
        return {
            restrict: 'E',
            templateUrl: 'templates/recorder.html',
            scope: {
                onrecorded: '=',
                onerror: '=',
                show: '='
            },
            link: function link(scope, element, attrs) {
                var mediaElement = element.find('video')[0];
                mediaElement.muted = true;
                mediaElement.controls = false;

                scope.stream = null;
                scope.isRecording = false;

                var constraints = {
                    audio: true,
                    video: true
                };

                scope.setStream = function(constraints) {
                    //mediaElement.pause();

                    navigator.getUserMedia(constraints, function(stream) {
                        scope.$apply(function() {
                            scope.stream = stream;

                            var url = recorderService.start(scope.stream);
                            mediaElement.src = url;
                            mediaElement.play();
                        });
                    }, function(error) {
                        console.log(error);
                    });
                };

                var videoSources = {},
                    curSource;

                MediaStreamTrack.getSources(function(sources) {
                    for (var i in sources) {
                        var src = sources[i];
                        if (src.kind === 'video') {
                            if (src.facing === 'environment' || src.facing === 'user') {
                                videoSources[src.facing] = src;
                            } else {
                                videoSources.generic = src;
                            }
                        }
                    }

                });

                scope.init = function() {
                    curSource = videoSources.environment || videoSources.generic;

                    constraints.video = {
                        optional: [{
                            sourceId: curSource.id
                        }]
                    };

                    scope.setStream(constraints);
                };

                scope.$watch(function() {
                    return scope.show;
                }, function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        if (newValue === true) {
                            scope.init();
                        } else {
                            //scope.hide();
                        }
                    }
                });

                scope.record = function() {
                    scope.isRecording = true;

                    recorderService.record();
                };

                scope.stop = function() {
                    scope.isRecording = false;

                    recorderService.stop()
                        .then(function(record) {
                            scope.onrecorded(record);
                            //mediaElement.controls = true;
                        })
                        .catch(function(err) {
                            scope.onerror(err);
                        });
                };

                scope.toggle = function() {
                    if (!scope.isRecording) {
                        scope.record();
                    } else {
                        scope.stop();
                    }
                };

                scope.canSwap = function() {
                    return !!(videoSources.environment && videoSources.user);
                };

                scope.swap = function() {
                    curSource = curSource.facing === 'environment' ? videoSources.user : videoSources.environment;

                    constraints.video = {
                        optional: [{
                            sourceId: curSource.id
                        }]
                    };
                    console.log(curSource);

                    scope.setStream(constraints);
                };
            }
        };
    });
