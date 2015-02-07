'use strict';

Package.describe({
    summary: 'Vazco Access',
    name: 'vazco:access',
    version: '1.0.4',
    git: 'https://github.com/vazco/vazco_access.git'
});

Package.on_use(function(api) {
    api.versionsFrom('METEOR@0.9.4');
    api.use(['vazco:universe-core@1.1.0', 'underscore', 'accounts-base'], ['client', 'server']);
    api.imply('vazco:universe-core');
    api.add_files('access.js', ['client', 'server']);
    api.add_files('publication.js', ['server']);
});

Package.on_test(function(api) {
    api.use([
        'coffeescript',
        'vazco:universe-core@1.1.0',
        'vazco:access',
        'underscore',
        'accounts-base',
        'tinytest',
        'test-helpers'
    ], ['client', 'server']);

    api.add_files([
        'access_test.js'
    ], ['client', 'server']);

    api.add_files([
        'publication_tests.coffee'
    ], ['server']);
});
