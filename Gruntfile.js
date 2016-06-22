module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        'gh-pages': {
            options: {
                branch: 'gh-pages'
            },
            publish: {
                repo: 'https://github.com/ahennr/SolrHeatmap.git',
                message: 'Publish gh-pages (grunt cli)',
                src: ['index.html', 'index-dev.html', 'app/**', 'build/**', 'assets/**', 'config/**', 'LICENSE', 'API/*.json']
            },
            deploy: {
                options: {
                    user: {
                        name: 'ahennr',
                        email: 'henn@terrestris.de'
                    },
                    repo: 'https://' + process.env.GH_TOKEN + '@github.com/terrestris/SolrHeatmap.git',
                    message: 'Publish gh-pages (auto)' + getDeployMessage(),
                    silent: true
                },
                src: ['index.html', 'index-dev.html', 'app/**', 'build/**', 'assets/**', 'config/**', 'LICENSE', 'API/*.json']
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'app/**/*.js'],
            options: {
                globals: {
                    undef: true,
                    unused: true,
                    curly: true,
                    eqeqeq: true,
                    devel: false,
                    globals: 'solrHeatmapApp',
                    latedef: true
                }
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        },
        concat: {
            options: {
                separator: '\n'
            },
            dist: {
                // the files to concatenate
                src: ['app/**/*.js'],
                // the location of the resulting JS file
                dest: 'build/hm-client.js'
            }
        },
        uglify: {
            options: {
              // the banner is inserted at the top of the output
              banner: '/*! Solr-Heatmap-Client created on <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
              files: {
                'build/hm-client.min.js': ['<%= concat.dist.dest %>']
              }
            }
}
    });

    // get a formatted commit message to review changes from the commit log
    // github will turn some of these into clickable links
    function getDeployMessage() {
        var ret = '\n\n';
        if (process.env.TRAVIS !== 'true') {
            ret += 'missing env vars for travis-ci';
            return ret;
        }
        ret += 'branch:       ' + process.env.TRAVIS_BRANCH + '\n';
        ret += 'SHA:          ' + process.env.TRAVIS_COMMIT + '\n';
        ret += 'range SHA:    ' + process.env.TRAVIS_COMMIT_RANGE + '\n';
        ret += 'build id:     ' + process.env.TRAVIS_BUILD_ID + '\n';
        ret += 'build number: ' + process.env.TRAVIS_BUILD_NUMBER + '\n';
        return ret;
    }

    grunt.registerTask('check-deploy', function() {
        // only deploy under these conditions
        if (process.env.TRAVIS === 'true' && process.env.TRAVIS_SECURE_ENV_VARS === 'true' && process.env.TRAVIS_PULL_REQUEST === 'false') {
            grunt.log.writeln('executing deployment');
            // queue deploy
            grunt.task.run('gh-pages:deploy');
        } else {
            grunt.log.writeln('skipped deployment');
        }
    });

    grunt.registerTask('publish', 'Publish from CLI', [
        'jshint',
        'concat',
        'uglify',
        'gh-pages:publish'
    ]);

    grunt.registerTask('deploy', 'Publish from travis', [
        'jshint',
        'concat',
        'uglify',
        'check-deploy'
    ]);
};
