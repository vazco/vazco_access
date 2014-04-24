'use strict';

Package.describe({
    summary: 'Vazco Access'
});

Package.on_use(function(api) {
    api.use(['underscore', 'accounts-base'], ['client', 'server']);
    api.add_files('access.js', ['client', 'server']);
    api.export(['Vazco'], ['client', 'server']);
});
