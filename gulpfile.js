import gulp from 'gulp';
import stylus from 'gulp-stylus';
import transform from 'gulp-transform';
import rename from "gulp-rename";
import Yargs from "yargs";
const argv = Yargs(process.argv.slice(2)).argv;


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