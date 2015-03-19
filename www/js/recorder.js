'use strict';

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

angular.module('dogapp.recorder', [])
    .factory('recorderService', function($q, $window) {
        var record,
            stream,
            meta;

        var Record = function() {
            var self = this;

            this.video = $window.RecordRTC(stream, {
                type: 'video'
            });

            this.audio = $window.RecordRTC(stream, {
                onAudioProcessStarted: function() {
                    self.video.startRecording();
                }
            });
            this.audio.startRecording();
        };

        function getSources() {
            var deferred = $q.defer();

            MediaStreamTrack.getSources(function(sources) {
                var videoSrc;

                for (var i in sources) {
                    var src = sources[i];
                    if (src.kind === 'video') {
                        if (src.facing === 'environment') {
                            videoSrc = src;
                            break;
                        }
                        videoSrc = videoSrc || src;
                    }
                }

                deferred.resolve({
                    audio: true,
                    video: {
                        optional: [{
                            sourceId: videoSrc.id
                        }]
                    }
                });
            });

            return deferred.promise;
        }

        function getStream(constraints) {
            var deferred = $q.defer();

            navigator.getUserMedia(constraints, function(stream) {
                deferred.resolve(stream);
            }, function(error) {
                console.log(error);
            });

            return deferred.promise;
        }

        /**
         * @TODO clean this process up and find most appropriate place to initiate
         */
        getSources()
            .then(function(sources) {
                return getStream(sources);
            })
            .then(function(str) {
                stream = str;
            })
            .catch(function(error) {
                console.log(error);
                //notifyService.notify(error);
            });

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
            start: function(stream, options) {
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
            getStream: function() {
                return stream;
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
                onerror: '='
            },
            link: function link(scope, element, attrs) {
                var mediaElement = element.find('video')[0];

                scope.type = {
                    'audio': true,
                    'video': true
                };

                scope.start = function() {
                    scope.isRecording = true;

                    var url = recorderService.start(recorderService.getStream(), scope.type);
                    mediaElement.src = url;
                    mediaElement.muted = true;
                    mediaElement.controls = false;
                    mediaElement.play();
                };

                scope.stop = function() {
                    scope.isRecording = false;

                    recorderService.stop()
                        .then(function(record) {
                            scope.onrecorded(record);
                        })
                        .catch(function(err) {
                            scope.onerror(err);
                        });
                };
            }
        };
    });
