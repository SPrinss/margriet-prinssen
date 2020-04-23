const gulp = require('gulp');
const stylus = require('gulp-stylus');
const transform = require('gulp-transform');
const rename = require('gulp-rename');
const argv = require('yargs').argv;

gulp.task('watch-styles', () => {
  return gulp.watch(`./${argv.folder}/**/*.styl`, gulp.series('modulize-styles'));
});

function modulizeCSS(content, file) {
  return `export const css = /* css */ \`\n${content}\``;
}

// compile the styles
gulp.task('modulize-styles', () => {
  return gulp.src(`./${argv.folder}/**/*.styl`)
    .pipe(stylus({compress: false}))
    .pipe(transform('utf8', modulizeCSS))
    .pipe(rename({ extname: '.css.js' }))
    .pipe(gulp.dest(file => file.base));
});