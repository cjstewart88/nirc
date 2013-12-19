module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: require('./package.json'),
    ngtemplates: {
      'nirc': {
        cwd: 'src',
        src: 'templates/**/*.html',
        dest: 'public/javascripts/nirc.templates.js'
      }
    },

    sass: {
      stylesheets: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['stylesheets/**/*.scss'],
          dest: 'public/',
          ext: '.css'
        }]
      }
    },

    concat: {
      options: {
        seperator: ';'
      },
      javascripts: {
        src:  ['src/javascripts/nirc.js', 'src/javascripts/**/*.js'],
        dest: 'public/javascripts/nirc.js'
      }
    },

    ngmin: {
      dist: {
        src: ['public/javascripts/nirc.js'],
        dest: 'public/javascripts/nirc.js'
      }
    },

    uglify: {
      dist: {
        files: {
          'public/javascripts/nirc.templates.js': 'public/javascripts/nirc.templates.js',
          'public/javascripts/nirc.js': 'public/javascripts/nirc.js'
        }
      }
    },

    clean: {
      builtFiles: [
        'public/javascripts/nirc.js',
        'public/javascripts/nirc.templates.js',
        'public/stylesheets/**/*.css'
      ]
    },

    watch: {
      templates: {
        files: 'src/templates/**/*.html',
        tasks: ['ngtemplates']
      },
      stylesheets: {
        files: ['src/stylesheets/**/*.scss'],
        tasks: ['sass']
      },
      javascripts: {
        files: ['src/javascripts/**/*.js'],
        tasks: 'concat'
      }
    }

  });

  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('build', ['ngtemplates', 'sass', 'concat']);
  grunt.registerTask('dist', ['clean', 'build', 'ngmin', 'uglify']);
};
