'use strict';

Package.describe({
    summary: 'Vazco Access'
});

Package.on_use(function(api) {
    api.use(['vazco-tools-common', 'underscore', 'accounts-base'], ['client', 'server']);
    api.use(['coffeescript'],['server']);
    api.add_files('access.js', ['client', 'server']);
    api.add_files('publish_with_relations.coffee', ['server']);
});

Package.on_test(function(api) {
    api.use(['vazco-tools-common', 'vazco-access', 'underscore', 'accounts-base', 'tinytest', 'test-helpers'], ['client', 'server']);
    api.add_files('access_test.js', ['client', 'server']);
});
