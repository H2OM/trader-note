const gulp = require('gulp');
const webpack = require('webpack-stream');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
// var historyapifallback = require('connect-history-api-fallback');
const fs = require('fs');
const dist = "./Dist";
const build = (process.argv.findIndex((val)=>val==="--dev") != "-1" ? "./build" : "");
gulp.task('server', function() {
    browserSync.init({
        // ui:{
        //     port: 3005,
        //     weinre: {
        //         port: 3004
        //     }
        // },
        proxy: "http://localhost/Projects/FullMagazine/Dist",
        host: "192.168.31.112"
        // middleware: [historyapifallback()],
        //  server: {
        //      baseDir: "Dist"
        //  }
    });
    gulp.watch("./src/*.+(html|php)").on("change", gulp.series("copy-html", browserSync.reload));
    gulp.watch("./src/scss/**/*.+(scss|sass)").on("change", gulp.series("styles", browserSync.reload));
    gulp.watch("./src/**/*.+(js|jsx)").on("change", gulp.series("build-js", browserSync.reload));
    gulp.watch("./src/assets/**/*.*").on("change", gulp.series("copy-assets", browserSync.reload));
    gulp.watch("./Dist/**/*.php").on("change",gulp.series(browserSync.reload));
});
gulp.task("copy-html", ()=>{
    return gulp.src("./src/*.+(html|php)")
                .pipe(gulp.dest(dist + "/App"))
                .pipe(browserSync.stream());
});
gulp.task("build-js", ()=>{
    return gulp.src("*.+(js|jsx|ts|tsx)")
        .pipe(webpack({
            entry: {
                script: "./index.tsx"
            },
            mode: (build !== "" ? "production" :'development'),
            output: {
                filename: '[name].js',
            },
            watch: false,
            devtool: (build !== "" ? false :'source-map'),
            module: {
                rules: [
                    {
                        test: /\.(js|jsx|ts|tsx)$/,
                        exclude: /(node_modules|bower_components)/,
                        use: [
                            {
                                loader: 'babel-loader',
                                options: {
                                    presets: [
                                        ['@babel/preset-env', {
                                            debug: (build !== "" ? false : true),
                                            corejs: 3,
                                            useBuiltIns: "usage"
                                        }],
                                        '@babel/preset-react',
                                        '@babel/preset-typescript'
                                    ]
                                },
                            },
                        ],
                    }
                ],
            },
    }))
    .pipe(gulp.dest('./assets/js/'))
    .pipe(browserSync.stream());
});

// gulp.task('styles', function() {
//     return gulp.src("./src/scss/style.+(scss|sass)")
//         .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
// 		.pipe(autoprefixer())
//         .pipe(cleanCSS({compatibility: 'ie8'}))
//         .pipe(hash({
//             'format': (build !== "" ? '{hash}_{name}-{hash:6}-{ext}' : '{name}{ext}')
//         }))
//         .pipe(filenames('css'))
//         .on('end', function () {
//             let names = {}, data = filenames.get('css');
//             for (let key in data) {
//                 let str = data[key];
//                 let strKey = str.replace(/.*_|-.*-/g, '');
//                 names[strKey] = str;
//             }
//             fs.writeFile(((build !== "" ? build : dist)) + '/styles/cssNames.json', JSON.stringify(names), 'utf8', function (err) {});
//         })
//         .pipe(gulp.dest((build !== "" ? build : dist) + "/styles"))
//         .pipe(browserSync.stream());
// });

// gulp.task("copy-api", ()=>{
//     return gulp.src("./api/**/*.*")
//                 .pipe(gulp.dest((build !== "" ? build : dist) + "/App/api"));
// });
// gulp.task("copy-assets", ()=>{
//     return gulp.src("./src/assets/**/*.*")
//                 .pipe(gulp.dest((build !== "" ? build : dist) + "/assets"));
// });
// gulp.task("copy-modules", ()=>{
//     return gulp.src("./src/modules/**/*.*")
//                 .pipe(gulp.dest((build !== "" ? build : dist) + "/App/modules"));
// });
// gulp.task("copy-linkModules", ()=>{
//     return gulp.src("./src/linkModules/**/*.*")
//                 .pipe(gulp.dest((build !== "" ? build : dist)));
// });


gulp.task("watch", () => {
    gulp.watch("./src/*.+(html|php)", gulp.series("copy-html"));
    gulp.watch("./Dist/**/*.php", gulp.series("copy-html"));
    // gulp.watch("./api/**/*.*", gulp.parallel("copy-api"));
    // gulp.watch("./src/modules/**/*.*", gulp.parallel("copy-modules"));
    // gulp.watch("./src/linkModules/**/*.*", gulp.parallel("copy-linkModules"));
    gulp.watch("./src/assets/**/*.*", gulp.parallel("copy-assets"));
    gulp.watch("./src/scss/**/*.+(scss|sass)", gulp.series("styles"));
    gulp.watch("./src/**/*.+(js|jsx)", gulp.series("build-js"));
});

gulp.task("default",gulp.series(gulp.parallel(
    // "copy-modules", "copy-linkModules", "copy-assets", "copy-api",
    "build-js", 
    "server",
    "copy-html"
    ),
     "watch"));

