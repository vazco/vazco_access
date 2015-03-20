'use strict';

Package.describe({
    summary: 'Vazco Access',
    name: 'vazco:access',
    version: "1.0.5",
    git: "https://github.com/vazco/vazco_access.git"
});

Package.on_use(function(api) {
    api.versionsFrom('METEOR@0.9.3');
    api.use(['vazco:tools-common@1.0.0', 'underscore', 'accounts-base'], ['client', 'server']);
    api.imply('vazco:tools-common');
    api.add_files('access.js', ['client', 'server']);
    api.add_files('publication.js', ['server']);
});
