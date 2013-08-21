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

    grunt.registerTask('default', ['uglify:def']);
    grunt.registerTask('t', ['jshint', 'mocha-phantomjs']);
};