const Gulp = require('gulp'), 
      AMDOptimize = require('amd-optimize'),
      Uglify = require('gulp-uglify'),
      Concat = require('gulp-concat');

Gulp.task('scripts', function() {
   Gulp.src('./public/js/**/*.js')
       .pipe(AMDOptimize('main', {configFile: './build/rjs_config.js'}))
       .pipe(Concat('app.js'))
       .pipe(Uglify({
           mangle: true 
       }))
       .pipe(Gulp.dest('./dist/js/'));
});

Gulp.task('default', ['scripts']);