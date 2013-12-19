module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: require('./package.json'),
    ngtemplates: {
      'nirc': {
        src: 'templates/**/*.html',
        dest: 'public/javascripts/nirc/templates.js'
      }
    },

    sass: {
      stylesheets: {
        files: [{
          expand: true,
          src: ['stylesheets/**/*.scss'],
          dest: 'public/',
          ext: '.css'
        }]
      }
    },

    watch: {
      templates: {
        files: 'templates/**/*.html',
        tasks: ['ngtemplates']
      },
      stylesheets: {
        files: ['stylesheets/**/*.scss'],
        tasks: 'sass'
      }
    }

  });

  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('build', ['ngtemplates', 'sass']);
};
