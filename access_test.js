'use strict';
var users = {
    user: {
        _id: 'user'
    },
    group: {
        _id: 'user_group',
        access_groups: ['group1', 'group2']
    },
    admin: {
        _id: 'admin',
        is_admin: true
    },
    sa: {
        _id: 'sa',
        SAFlag: true
    },
    no_access: {
        _id: 'no_access'
    }
};

var docs = {
    user: {
        access: {
            show: ['irrelevant', 'user']
        }
    },
    string: {
        access: {
            show: 'everyone'
        }
    },
    string_nope: {
        access: {
            show: 'nope'
        }
    },
    nope: {
        access: {
            show: ['nope', 'irrelevant']
        }
    },
    group: {
        access: {
            show: ['irrelevant', 'group1', 'irrelevant2']
        }
    },
    no_access_doc: {
    },
    sa: {
        access: {
            show: ['irrelevant', 'testSA', 'irrelevant2']
        }
    },
    everyone: {
        access: {
            show: ['irrelevant', 'everyone', 'irrelevant2']
        }
    },
    logged: {
        access: {
            show: ['irrelevant', 'logged', 'irrelevant2']
        }
    },
    disabled: {
        disabled: true,
        access: {
            show: ['everyone', 'irrelevant']
        }
    }
};


if (Meteor.isServer) {

    Vazco.Access.adminOverride = true;

    Vazco.Access.addSA('testSA', function(userObj) {
        if (userObj && userObj.SAFlag) {
            return true;
        }
        return false;
    });


    Tinytest.add('Vazco Access - User access test', function(test) {
        var user = users.user;
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.user, user));
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, user));
        test.equal(true, Vazco.Access.resolve('show', docs.logged, user));
        test.equal(true, Vazco.Access.resolve('show', docs.string, user));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.string_nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.group, user));
        test.equal(false, Vazco.Access.resolve('show', docs.sa, user));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, user));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc, user));
    });

    Tinytest.add('Vazco Access - User group test', function(test) {
        var user = users.group;
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.group, user));
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, user));
        test.equal(true, Vazco.Access.resolve('show', docs.logged, user));
        test.equal(true, Vazco.Access.resolve('show', docs.string, user));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.string_nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc, user));
        test.equal(false, Vazco.Access.resolve('show', docs.sa, user));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, user));
        test.equal(false, Vazco.Access.resolve('show', docs.user, user));

    });

    Tinytest.add('Vazco Access - Admin test', function(test) {
        var user = users.admin;
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.user, user));
        test.equal(true, Vazco.Access.resolve('show', docs.string_nope, user));
        test.equal(true, Vazco.Access.resolve('show', docs.nope, user));
        test.equal(true, Vazco.Access.resolve('show', docs.group, user));
        test.equal(true, Vazco.Access.resolve('show', docs.no_access_doc, user));
        test.equal(true, Vazco.Access.resolve('show', docs.sa, user));
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, user));
        test.equal(true, Vazco.Access.resolve('show', docs.logged, user));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, user));
    });

    Tinytest.add('Vazco Access - SA test', function(test) {
        var user = users.sa;
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.sa, user));
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, user));
        test.equal(true, Vazco.Access.resolve('show', docs.logged, user));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.user, user));
        test.equal(false, Vazco.Access.resolve('show', docs.string_nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.group, user));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc, user));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, user));
    });

    Tinytest.add('Vazco Access - User with no rights test', function(test) {
        var user = users.no_access;
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, user));
        test.equal(true, Vazco.Access.resolve('show', docs.logged, user));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.user, user));
        test.equal(false, Vazco.Access.resolve('show', docs.string_nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.nope, user));
        test.equal(false, Vazco.Access.resolve('show', docs.group, user));
        test.equal(false, Vazco.Access.resolve('show', docs.sa, user));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc, user));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, user));
    });

    Tinytest.add('Vazco Access - No user test', function(test) {
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, null));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.user, null));
        test.equal(false, Vazco.Access.resolve('show', docs.string_nope, null));
        test.equal(false, Vazco.Access.resolve('show', docs.nope, null));
        test.equal(false, Vazco.Access.resolve('show', docs.group, null));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc, null));
        test.equal(false, Vazco.Access.resolve('show', docs.sa, null));
        test.equal(false, Vazco.Access.resolve('show', docs.logged, null));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, null));

        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.everyone));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.user));
        test.equal(false, Vazco.Access.resolve('show', docs.string_nope));
        test.equal(false, Vazco.Access.resolve('show', docs.nope));
        test.equal(false, Vazco.Access.resolve('show', docs.group));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc));
        test.equal(false, Vazco.Access.resolve('show', docs.sa));
        test.equal(false, Vazco.Access.resolve('show', docs.logged));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled));
    });
}