module.exports = function ( config ) {
  config.set({
    basePath: '.',
    files: [
      'assets/lib/angularjs/angular.min.js',
      'assets/lib/angularjs/angular.min.js',
      "assets/lib/jquery/jquery-2.1.3.min.js",
      "assets/lib/bootstrap/js/bootstrap.min.js",
      "assets/lib/ui-bootstrap/ui-bootstrap-tpls-1.3.3.min.js",
      "assets/lib/proj4js/proj4.js",
      "config/3857.js",
      "assets/lib/ol3/ol.js",
      'node_modules/angularjs-slider/dist/rzslider.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'app/**/*.js',
      'tests/**/*.spec.js'
    ],
    exclude: [
    ],
    frameworks: [ 'jasmine' ],
    preprocessors: {
      'app/**/*.js': ['coverage']
    },
    reporters: ['spec','coverage'],
    port: 9018,
    runnerPort: 9100,
    urlRoot: '/',
    autoWatch: false,
    coverageReporter: {
      dir: 'reports',
      reporters:[
        {type: 'html', subdir: 'html/'},
        {type: 'lcovonly', subdir: 'coverage/', file: 'lcov.info'},
      ]
    },
    browsers: [
      'PhantomJS'
    ]
  });
};
