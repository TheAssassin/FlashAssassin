var FlashAssassin = angular.module("FlashAssassin", ["ui.bootstrap", "ngStorage"])


FlashAssassin.service("FlashAirClient", function($http) {
    var service = {
        // fetches the directory contents using the FlashAir API
        getDirectoryContent: function(directory) {
            if(directory == "")
                directory = "/"

            var url = "/command.cgi?op=100&DIR=" + directory

            var promise = $http.get(url).then(function(response) {
                return response.data
            }, function(response) {
                console.log("getDirectoryContent failed!")
            })

            return promise
        },

        // parses a reply that is fetched using getDirectoryContent and returns a list of directory entries
        parseReply: function(data) {
            var rv = []
            
            var entries = data.split("\n")
            
            // Remove unnecessary WLANSD_FILELIST line
            entries.shift(0)
            
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i].split(",")

                // ignore empty lines and other incompatible data
                if (entry.length < 6)
                    continue

                // extract fields
                parentDirectory = entry[0]
                basename = entry[1]
                size = entry[2]
                flags = entry[3]
                date = entry[4]
                time = entry[5]

                fullPath = parentDirectory + "/" + basename

                // sanitize directory
                if (parentDirectory == "")
                    parentDirectory = "/"

                if (basename === undefined) {
                    console.log(entries[i])
                }
                extension = basename.split(".")[1]
                if (extension !== undefined)
                    extension = extension.toLowerCase()

                // build entry
                var contentsEntry = {
                    parentDirectory: parentDirectory,
                    basename: basename,
                    
                    // convenience entries
                    fullPath: fullPath,
                    extension: extension,
                    
                    size: parseInt(size),
                    
                    // defined by FlashAir API
                    isReadOnly: !!(flags & (1 << 0)),
                    isHidden: !!(flags & (1 << 1)),
                    isSystemFile: !!(flags & (1 << 2)),
                    isVolume: !!(flags & (1 << 3)),
                    isDirectory: !!(flags & (1 << 4)),
                    isArchive: !!(flags & (1 << 5)),

                    date: parseInt(date),
                    time: parseInt(time)
                }
                
                rv.push(contentsEntry)
            }
            
            // sorting required as the server reply might not be sorted already
            rv = rv.sort(function(first, second) {
                return first.date - second.date || first.time - second.time
            })

            return rv
        }
    }
    
    return service
})


FlashAssassin.directive("imgload", function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            element.bind("load", function() {
                scope.$apply(attrs.imgload)
            })
        }
    };
})


FlashAssassin.controller("MainCtrl", function($scope, $uibModal, $timeout, $interval, $localStorage, FlashAirClient) {
    // state variables
    $scope.running = true
    $scope.imgLoading = false

    $timeout(function() {
        if ($scope.running)
            loadImage()
    });

    // starts or stops fetching the latest image
    $scope.togglePlay = function() {
        $scope.running = !$scope.running;

        // trigger image loading immediately
        if ($scope.running)
            loadImage()
    }

    var intervalScheduled = false

    // searches for new images on the SD card and sets the img src attribute accordingly
    function loadImage() {
        if ($scope.running) {
            FlashAirClient.getDirectoryContent($localStorage.dirPath || "/").then(function(data) {
                var allFiles = FlashAirClient.parseReply(data)
                
                var jpegFiles = allFiles.filter(function(file) {
                    return file.extension == "jpg" || file.extension == "jpeg"
                })
                
                $scope.files = jpegFiles
                
                var currentImg = $scope.files.slice(-1)[0]

                if (currentImg !== undefined && ($scope.currentImg === undefined || $scope.currentImg.fullPath != currentImg.fullPath)) {
                    console.log("Loading new image")
                    $scope.imgLoading = true
                    $scope.curentImg = "";
                    $scope.currentImg = currentImg
                } else {
                    console.log("No new image detected")
                }
            })
        }

        // schedule this function to run periodically, but make sure there's just one interval instance at a time
        if (!intervalScheduled) {
            $interval(loadImage, 2500)
            intervalScheduled = true
        }
    }

    // show the modal that allows setting the directory to search for JPEGs in
    $scope.showSettings = function() {
        $scope.settingsModal = $uibModal.open({
            templateUrl: "settings.html",
            controller: "SettingsModalCtrl",
            size: "lg",
        })
    }
})


FlashAssassin.controller("SettingsModalCtrl", function($scope, $uibModalInstance, $localStorage, FlashAirClient) {
    // bind local storage to scope to allow usage in the template
    $scope.$storage = $localStorage
    
    $scope.close = function() {
        $uibModalInstance.close()
    }

    $scope.subDirs = [
        {
            path: "/",
            name: "/",
            subDirs: []
        }
    ]

    // recursively builds the directory tree that is rendered using a recursive angular template
    function buildSubDirsTree(dirEntry) {
        FlashAirClient.getDirectoryContent(dirEntry.path).then(function(data) {
            // filter out files
            var entries = FlashAirClient.parseReply(data).filter(function(x) {
                return x.isDirectory;
            })

            for (var i = 0; i < entries.length; i++) {
                newDirName = entries[i].basename
                newDirPath = entries[i].fullPath
                
                // create new ojbect in the parent's subDirs object
                var newDirEntry = {
                    path: newDirPath,
                    name: newDirName,
                    subDirs: [],
                }
                
                // register as parent's subdirectory
                dirEntry.subDirs.push(newDirEntry)
                
                // now continue building tree recursively
                buildSubDirsTree(newDirEntry)
            }
        })
    }
    
    buildSubDirsTree($scope.subDirs[0])
})
