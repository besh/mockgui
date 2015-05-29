var gulp = require('gulp');
var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');

gulp.task('default', function () {
  options = {
    batch : ['./views/partials'],
  }

  return gulp.src('views/*.hbs')
    .pipe(handlebars(null, options))
    .pipe(rename('mock.html'))
    .pipe(gulp.dest('public'));
});