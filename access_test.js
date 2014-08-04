'use strict';
var users = {
    user: {
        _id: 'user',
        access_groups: ['group1', 'group2']
    },
    admin: {
        _id: 'admin',
        is_admin: true
    }
};

var docs = {
    user: {
        access: {
            show: {
                allow: {
                    user: ['irrelevant', 'user']
                }
            }
        }
    },
    nope: {
        access: {
            show: {
                allow: {
                    sa: ['nope', 'irrelevant'],
                    user: ['nope', 'irrelevant'],
                    group: ['nope', 'irrelevant']
                }
            }
        }
    },
    group: {
        access: {
            show: {
                allow: {
                    group: ['irrelevant', 'group1', 'irrelevant2']
                }
            }
        }
    },
    no_access_doc: {
    },
    everyone: {
        access: {
            show: {
                allow: {
                    sa: ['irrelevant', 'everyone', 'irrelevant2']
                }
            }
        }
    },
    disabled: {
        disabled: true,
        access: {
            show: {
                allow: {
                    sa: ['everyone', 'irrelevant']
                }
            }
        }
    },
    deny: {
        disabled: true,
        access: {
            show: {
                allow: {
                    sa: ['everyone', 'irrelevant']
                },
                deny: {
                    user: ['user']
                }
            }
        }
    }
};


if (Meteor.isClient) {

    Vazco.Access.globalAccess = {
        show: {
            allow: {
                sa: ['admin']
            },
            deny: {
                sa: ['disabled']
            }
        }
    };

    Tinytest.add('Vazco Access - Access tests', function(test) {
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.user, users.user));
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, users.user));
        test.equal(true, Vazco.Access.resolve('show', docs.group, users.user));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.nope, users.user));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, users.user));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc, users.user));
        test.equal(false, Vazco.Access.resolve('show', docs.deny, users.user));
    });

    Tinytest.add('Vazco Access - Admin test', function(test) {
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.user, users.admin));
        test.equal(true, Vazco.Access.resolve('show', docs.nope, users.admin));
        test.equal(true, Vazco.Access.resolve('show', docs.group, users.admin));
        test.equal(true, Vazco.Access.resolve('show', docs.no_access_doc, users.admin));
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, users.admin));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, users.admin));
    });

    Tinytest.add('Vazco Access - No user test', function(test) {
        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.everyone, null));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.user, null));
        test.equal(false, Vazco.Access.resolve('show', docs.nope, null));
        test.equal(false, Vazco.Access.resolve('show', docs.group, null));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc, null));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled, null));

        // yep
        test.equal(true, Vazco.Access.resolve('show', docs.everyone));

        // nope
        test.equal(false, Vazco.Access.resolve('show', docs.user));
        test.equal(false, Vazco.Access.resolve('show', docs.nope));
        test.equal(false, Vazco.Access.resolve('show', docs.group));
        test.equal(false, Vazco.Access.resolve('show', docs.no_access_doc));
        test.equal(false, Vazco.Access.resolve('show', docs.disabled));
    });

    Tinytest.add('Vazco Access - Diff test', function (test) {
        test.equal(Vazco.Access.diff({
            a: 1,
            b: 2
        }, {
            a: 1,
            b: 2
        }), {});

        test.equal(Vazco.Access.diff({
            a: 1,
            b: 2
        }, {
            a: 1,
            b: 'diff'
        }), {b: 'diff'});

        test.equal(Vazco.Access.diff({
            a: 1,
            b: 2
        }, {
            a: 1
        }), {b: undefined});

        test.equal(Vazco.Access.diff({
            a: {a: 3}
        }, {
            a: {a: 3}
        }), {});

        test.equal(Vazco.Access.diff({
            a: {
                a: 1,
                b: 2
            }
        }, {
            a: {
                a: 1,
                b: 'diff'
            }
        }), {
            a: {
                a: 1,
                b: 'diff'
            }
        });

        test.equal(Vazco.Access.diff({
            a: {
                a: 1,
                b: 2
            }
        }, {
            a: {
                a: 1
            }
        }), {a: {
            a: 1
        }});

        test.equal(Vazco.Access.diff({
            a: {
                a: 1,
                b: 2
            }
        }, {
            a: 3
        }), {a: 3});

        test.equal(Vazco.Access.diff({
            a: {
                a: 1,
                c: 3
            }
        }, {
            a: {
                a: 1,
                b: 2,
                c: 3
            }
        }), {a: {
            a: 1,
            b: 2,
            c: 3
        }});

        test.equal(Vazco.Access.diff({
            a: {
                a: 1,
                b: 2,
                c: 3
            },
            b: 3
        }, {
            b: 3
        }), {
            a: undefined
        });

        test.equal(Vazco.Access.diff({
            a: [1,2,4],
            b: {}
        }, {
            a: 1,
            b: {g:4}
        }), {
            a: 1,
            b: {g:4}
        });

        test.equal(Vazco.Access.diff({
            a: [1,2,4],
            b: {},
            c: 'string'
        }, {}
        ), {
            a: undefined,
            b: undefined,
            c: undefined
        });
    });
}