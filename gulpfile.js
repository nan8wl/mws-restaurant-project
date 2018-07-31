const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const imageMin = require('gulp-imagemin');
const resize = require('gulp-image-resize');
const rename = require('gulp-rename');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const prefix = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const cssMin = require('gulp-csso');

// Reduce images functions
gulp.task('clean-images', function() {
    return del('./img/optimized');
});

gulp.task('clean-dist-css', function() {
    return del('./dist/css');
});

gulp.task('clean-dist-js', function() {
    return del('./dist/js');
});

gulp.task('reduce-images', ['clean-images'], function() {
    gulp.src('./img/*.{jpg, png}') 
        .pipe(resize({ 
            width: 800, 
            quality: 0.5
        }))
        .pipe(imageMin()) 
        .pipe(rename(function (path) { path.basename += "-optimized"; })) 
        .pipe(gulp.dest('./img/optimized'))
});

// Watching functions
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./",
            index: "index.html"
        },
        logLevel: "warn",
        injectChanges: false
    });
});

gulp.task('html', function() {
    gulp.src('./*.html')
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('css', ['clean-dist-css'], function() {
    gulp.src('./css/*.css')
    .pipe(sourcemaps.init())
    .pipe(prefix())
    .pipe(cssMin())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('js', ['clean-dist-js'], function() {
    gulp.src('./js/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/js'))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('watch', function() {
    gulp.watch('./*.html', ['html']);
    gulp.watch('./css/*.css', ['css']);
    gulp.watch('./js/*.js', ['js']);
});

gulp.task('start', ['browser-sync', 'watch']);
