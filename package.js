'use strict';

Package.describe({
    summary: 'Vazco Access',
    name: 'vazco:access',
    version: "1.0.1",
    git: "https://cristo-rabani@bitbucket.org/vazco/m_vazco_access.git"
});

Package.on_use(function(api) {
    api.use(['vazco:tools-common@1.0.0', 'underscore@1.0.1', 'accounts-base@1.1.2'], ['client', 'server']);
    api.add_files('access.js', ['client', 'server']);
    api.add_files('publication.js', ['server']);
});

Package.on_test(function(api) {
    api.use([
        'coffeescript',
        'vazco:tools-common',
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
