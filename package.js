'use strict';

Package.describe({
    summary: 'Vazco Access',
    name: 'vazco:access',
    version: "1.1.0",
    git: "https://github.com/vazco/vazco_access.git"
});

Package.on_use(function(api) {
    api.versionsFrom('METEOR@1.0.4');
    api.use(['vazco:universe-core@1.6.7', 'underscore', 'accounts-base'], ['client', 'server']);
    api.imply('vazco:tools-common');
    api.add_files('access.js', ['client', 'server']);
    api.add_files('publication.js', ['server']);
});
