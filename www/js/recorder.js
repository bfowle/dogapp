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

        var workerPath = 'http://localhost:8100/js/ffmpeg_asm.js';
        //var workerPath = 'https://4dbefa02675a4cdb7fc25d009516b060a84a3b4b.googledrive.com/host/0B6GWd_dUUTT8WjhzNlloZmZtdzA/ffmpeg_asm.js';

        function processInWebWorker() {
            var blob = $window.URL.createObjectURL(new Blob([
                'importScripts("' + workerPath + '");' +
                'var now = Date.now;' +
                'function print(text) {' +
                '   postMessage({"type": "stdout", "data": text});' +
                '};' +
                'onmessage = function(event) {' +
                '    var message = event.data;' +
                '    if (message.type === "command") {' +
                '        var Module = {' +
                '            print: print,' +
                '            printErr: print,' +
                '            files: message.files || [],' +
                '            arguments: message.arguments || [],' +
                '            TOTAL_MEMORY: message.TOTAL_MEMORY || false' +
                '        };' +
                '        postMessage({' +
                '           "type": "start",' +
                '           "data": Module.arguments.join(" ")' +
                '        });' +
                '        postMessage({' +
                '           "type": "stdout",' +
                '           "data": "Received command: " + Module.arguments.join(" ") + ((Module.TOTAL_MEMORY) ? ". Processing with " + Module.TOTAL_MEMORY + " bits." : "")' +
                '        });' +
                '        var time = now();' +
                '        var result = ffmpeg_run(Module);' +
                '        var totalTime = now() - time;' +
                '        postMessage({' +
                '            "type": "stdout",' +
                '            "data": "Finished processing (took " + totalTime + "ms)"' +
                '        });' +
                '        postMessage({' +
                '            "type": "done",' +
                '            "data": result,' +
                '            "time": totalTime' +
                '        });' +
                '    }' +
                '};' +
                'postMessage({"type": "ready"});'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            $window.URL.revokeObjectURL(blob);
            return worker;
        }

        var worker;

        Record.prototype.convertStreams = function() {
            var vab,
                aab,
                buffersReady,
                workerReady,
                posted = false,
                videoBlob = this.video.getBlob(),
                audioBlob = this.audio.getBlob(),
                fileReader1 = new FileReader(),
                fileReader2 = new FileReader(),
                videoFile = !!navigator.mozGetUserMedia ? 'video.gif' : 'video.webm',
                deferred = $q.defer();

            fileReader1.onload = function() {
                vab = this.result;
                if (aab) {
                    buffersReady = true;
                }
                if (buffersReady && workerReady && !posted) {
                    postMessage();
                }
            };

            fileReader2.onload = function() {
                aab = this.result;
                if (vab) {
                    buffersReady = true;
                }
                if (buffersReady && workerReady && !posted) {
                    postMessage();
                }
            };

            fileReader1.readAsArrayBuffer(videoBlob);
            fileReader2.readAsArrayBuffer(audioBlob);

            if (!worker) {
                worker = processInWebWorker();
            }

            worker.onmessage = function(event) {
                var message = event.data;
                //console.log(JSON.stringify(message));

                if (message.type == 'ready') {
                    console.log('file has been loaded');
                    workerReady = true;
                    if (buffersReady) {
                        postMessage();
                    }
                } else if (message.type == 'stdout') {
                    console.log(message.data);
                } else if (message.type == 'start') {
                    console.log('file received ffmpeg command');
                } else if (message.type == 'done') {
                    var result = message.data[0],
                        blob = new Blob([result.data], { type: 'video/mp4' });
                    console.log(JSON.stringify(result));
                    console.log(JSON.stringify(blob));
                    deferred.resolve(blob);
                }
            };

            function postMessage() {
                posted = true;
                worker.postMessage({
                    type: 'command',
                    arguments: [
                        '-i', videoFile, 
                        '-i', 'audio.wav', 
                        '-c:v', 'mpeg4', 
                        '-c:a', 'vorbis', 
                        '-b:v', '6400k', 
                        '-b:a', '4800k', 
                        '-strict', 'experimental', 'output.mp4'
                    ],
                    files: [{
                        data: new Uint8Array(vab),
                        name: videoFile
                    }, {
                        data: new Uint8Array(aab),
                        name: 'audio.wav'
                    }]
                });
            }

            return deferred.promise;
        };

        Record.prototype.populateBlobData = function() {
            var deferred = $q.defer(),
                self = this;

            $q.all([
                self.getAudioUrl(),
                self.getVideoUrl()
            ]).then(function(data) {
                deferred.resolve(data[1]);

                //self.convertStreams()
                //    .then(function(data) {
                //        deferred.resolve(data);
                //    });
            });

            return deferred.promise;
        };

        return {
            start: function(stream) {
                record = new Record(stream);
                return $window.URL.createObjectURL(stream);
            },
            stop: function(stream) {
                var deferred = $q.defer();
                record.populateBlobData()
                    .then(function(data) {
                        stream.stop();
                        //$window.URL.revokeObjectURL(stream);
                        deferred.resolve(data);
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
    .directive('recorder', function($window, recorderService) {
        return {
            restrict: 'E',
            templateUrl: 'templates/recorder.html',
            scope: {
                onerror: '=',
                onrecorded: '=',
                onsnapped: '=',
                onretake: '=',
                show: '='
            },
            link: function(scope, element, attrs) {
                var mediaElement = element.find('video')[0];
                mediaElement.muted = true;
                mediaElement.controls = false;

                scope.stream = null;
                scope.isRecording = false;

                var constraints = {
                    video: true,
                    audio: true
                };

                scope.setStream = function(constraints) {
                    scope.stream && scope.stream.stop();

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
                    var src,
                        i;
                    for (i in sources) {
                        src = sources[i];
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
                        optional: [{ sourceId: curSource.id }]
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
                            scope.show = false;
                        }
                    }
                });

                scope.record = function() {
                    scope.isRecording = true;

                    var url = recorderService.start(scope.stream);
                    mediaElement.src = url;
                    mediaElement.muted = true;
                    mediaElement.controls = false;

                    recorderService.record();
                };

                scope.stop = function() {
                    scope.isRecording = false;

                    recorderService.stop(scope.stream)
                        .then(function(data) {
                            scope.onrecorded(data);

                            mediaElement.src = data;
                            mediaElement.muted = false;
                            mediaElement.controls = true;
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

                /*
                scope.snap = function() {
                    var width = 800;
                    var height = 0;

                    var video = document.getElementById('video');
                    var canvas = document.getElementById('canvas');

                    height = video.videoHeight / (video.videoWidth / width);
                    if (isNaN(height)) {
                        height = width / (4 / 3);
                    }
                    canvas.width = width;
                    canvas.height = height;

                    var context = canvas.getContext('2d');
                    context.drawImage(video, 0, 0, width, height);

                    var data = canvas.toDataURL('image/png');
                    scope.onsnapped(data);
                };

                scope.retake = function() {
                    scope.show = true;
                    scope.onretake();
                };

                scope.snapToggle = function() {
                    if (scope.show) {
                        scope.snap();
                    } else {
                        scope.retake();
                    }
                }
                */

                scope.canSwap = function() {
                    return !!(videoSources.environment && videoSources.user);
                };

                scope.swap = function() {
                    curSource = curSource.facing === 'environment' ? videoSources.user : videoSources.environment;

                    constraints.video = {
                        optional: [{ sourceId: curSource.id }]
                    };
                    console.log(curSource);

                    scope.setStream(constraints);
                };
            }
        };
    });
