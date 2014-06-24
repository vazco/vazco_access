'use strict';
Vazco.Access = {};

//--------------- Methods for resolving access ------------------

Vazco.Access.resolve = function (type, doc, user) {

    var userObj = _.isObject(user) ? user : this._getUser(user);


    if (doc.access && _.isString(type) && doc.access[type]) {
        return this.resolveAccess(doc.access[type], userObj, doc);
    }
    return false;
};

Vazco.Access.resolveAccess = function (access, user, doc) {
    var userObj = _.isObject(user) ? user : this._getUser(user);

    if (access) {
        if (_.isObject(access.deny) && this._resolveAll(access.deny, userObj, doc)) {
            return false;
        } else if (_.isObject(access.allow) && this._resolveAll(access.allow, userObj, doc)) {
            return true;
        }
    }
    return false;
};

//-------------------- Internal methods -----------------------

Vazco.Access._resolveAll = function (accessObj, userObj, doc){
    if (this._resolveSA(accessObj.sa, userObj, doc)) {
        return true;
    }
    if (this._resolveUser(accessObj.user, userObj)) {
        return true;
    }
    if (this._resolveGroup(accessObj.group, userObj)) {
        return true;
    }
    return false;
};

Vazco.Access._resolveSA = function (accessArray, userObj, doc) {
    return _.some(accessArray, function (access) {
        if (this._SA[access]) {
            return this._SA[access](userObj, doc);
        }
    });
};

Vazco.Access._resolveUser = function (accessArray, userObj) {
    if (userObj && userObj._id) {
        return _.intersection(accessArray, [userObj._id]).length > 0;
    }
    return false;
};

Vazco.Access._resolveGroup = function (accessArray, userObj) {
    if (userObj) {
        return _.intersection(accessArray, this.getGroups(userObj)).length > 0;
    }
    return false;
};

Vazco.Access._getUser = function (userId) {
    return Meteor.users.findOne({_id: userId});
};

// --------- Allow function you can put as callbacks ----------

Vazco.Access.allowUpdate = function (userId, doc) {
    if (doc.access) {
        return this.resolve('update', doc, userId);
    }
    return false;
};

Vazco.Access.allowRemove = function (userId, doc) {
    if (doc.access) {
        return this.resolve('remove', doc, userId);
    }
    return false;
};

// ------------- Default Special access groups -------------------

Vazco.Access._SA = {
    everyone: function () {
        return true;
    },
    logged: function (userObj) {
        if (userObj) {
            return true;
        }
        return false;
    },
    owner: function (userObj, doc) {
        return _.isObject(userObj) && _.isObject(doc) && userObj._id === doc.ownerId
    },
    admin: function (userObj) {
        return _.isObject(userObj) && userObj.is_admin
    },
    disabled: function (userObj, doc) {
        return _.isObject(doc) && doc.disabled;
    }
};

// ----------- Methods for adding/removing Special access groups -----------

/**
 * Method for setting special access group
 * @param {string} id - SA ID (used in access arrays)
 * @param {function} predicateFn - one atribute function (user object) returns
 * boolean
 */
Vazco.Access.addSA = function (id, predicateFn) {
    if (_.isString(id) && _.isFunction(predicateFn)) {
        this._SA[id] = predicateFn;
    }
    else {
        throw new Error('Wrong parameters');
    }
};

Vazco.Access.removeSA = function (id) {
    if (_.isString(id)) {
        if (_.isFunction(this._SA[id])) {
            delete this._SA[id];
        }
    }
    else {
        throw new Error("removeSA argument must be string (SA id)");
    }
};

//-------------------- Getters ------------------------

Vazco.Access.getGroups = function (userObj) {
    if (userObj) {
        return userObj.access_groups;
    }
};

//------------------- Global access ---------------

Vazco.Access.globalAccess = {
    show: {
        allow: {
            sa: ['admin']
        },
        deny: {
            sa: ['disabled']
        }
    },
    update: {
        allow: {
            sa: ['admin']
        }
    },
    remove: {
        allow: {
            sa: ['admin']
        }
    }
};