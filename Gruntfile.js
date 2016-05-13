module.exports = function(grunt) {
    var compilerPackage = require('google-closure-compiler');
    compilerPackage.grunt(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['Gruntfile.js', 'rader.js', 'test/**/*.js'],
            options: {
                "indent": 4,
                "node": true,
                "browser": true,
                "jquery": true,
                "eqnull": true,
                "eqeqeq": false,
                "devel": false,
                "boss": true,
                "trailing": true,
                "loopfunc": true,
                "-W041": true,
                "-W015": true
            }
        },
        'closure-compiler': {
            my_target: {
                files: {
                    'rader.min.js': ['rader.js']
                },
                options: {
                    compilation_level: 'ADVANCED',
                    language_in: 'ECMASCRIPT5_STRICT',
                    language_out: 'ECMASCRIPT5_STRICT',
                    create_source_map: 'rader.min.js.map',
                    output_wrapper: '%output%\n//# sourceMappingURL=rader.min.js.map'
                }
            }
        },
        jscs: {
            src: ['<%= pkg.name %>.js'],
            options: {
                config: ".jscs.json"
            }
        },
        'mocha-phantomjs': {
            options: {
                view: '1024x768'
            },
            all: ['test/*.auto.html']
        }
    });

    grunt.loadTasks('tasks'); // Для grunt-mocha-phantomjs
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask('build', ['closure-compiler']);

    grunt.registerTask('default', 'build');
    grunt.registerTask('test', ['build', 'mocha-phantomjs']);
    grunt.registerTask('t', ['jscs', 'jshint', 'mocha-phantomjs']);
};