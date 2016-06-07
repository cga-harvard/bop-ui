'use strict';

module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-gh-pages');

	grunt.initConfig({
		'gh-pages': {
			options: {
				branch: 'gh-pages',
        repo: 'https://github.com/ahennr/SolrHeatmap.git',
        message: 'Publish gh-pages (grunt cli)'
			},
      src: ['**/*']
		}
	});

	grunt.registerTask('build', 'SolrHeatmap deploy to gh-pages', [
		'gh-pages:gh-pages'
	]);

};
