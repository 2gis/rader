module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            appjs: {
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
                },
                src: ['rader.js', 'test/*.js']
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            def: {
                files: {
                    '<%= pkg.name %>.min.js': ['<%= pkg.name %>.js'],
                    'demo/<%= pkg.name %>.js': ['<%= pkg.name %>.js']
                }
            }
        },
        'closure-compiler': {
            frontend: {
                closurePath: '/usr/local/Cellar/closure-compiler/20130823/libexec',
                js: '<%= pkg.name %>.js',
                jsOutputFile: '<%= pkg.name %>.min.js',
                maxBuffer: 500,
                options: {
                    compilation_level: 'ADVANCED_OPTIMIZATIONS', // 'SIMPLE_OPTIMIZATIONS', // ADVANCED_OPTIMIZATIONS
                    language_in: 'ECMASCRIPT5_STRICT'
                },
                noreport: true
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
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks("grunt-jscs-checker");
    grunt.loadNpmTasks('grunt-closure-compiler');

    // grunt.registerTask('build', ['uglify:def']);
    grunt.registerTask('build', ['closure-compiler']);

    grunt.registerTask('default', 'build');
    grunt.registerTask('test', ['build', 'mocha-phantomjs']);
    grunt.registerTask('t', ['jscs', 'jshint', 'mocha-phantomjs']);
};