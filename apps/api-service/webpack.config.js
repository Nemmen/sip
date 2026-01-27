module.exports = function (options, webpack) {
    const lazyImports = [
        '@nestjs/microservices',
        '@nestjs/microservices/microservices-module',
        '@nestjs/websockets/socket-module',
        'mock-aws-s3',
        'aws-sdk',
        'nock',
        'class-transformer/storage',
        '@mapbox/node-pre-gyp',
    ];

    return {
        ...options,
        externals: [],
        output: {
            ...options.output,
            libraryTarget: 'commonjs2',
        },
        plugins: [
            ...options.plugins,
            new webpack.IgnorePlugin({
                checkResource(resource) {
                    if (!lazyImports.some((lib) => resource.includes(lib))) {
                        return false;
                    }
                    try {
                        require.resolve(resource, {
                            paths: [process.cwd()],
                        });
                    } catch (err) {
                        return true;
                    }
                    return false;
                },
            }),
        ],
    };
};
