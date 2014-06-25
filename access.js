'use strict';
Vazco.Access = {};

//--------------- Methods for resolving access ------------------

Vazco.Access.resolve = function (type, doc, user) {
    var globalResolve,
        localResolve;

    var userObj = _.isObject(user) ? user : this._getUser(user);

    if (_.isString(type)) {
        if (this.globalAccess && this.globalAccess[type]) {
            globalResolve = this.resolveAccess(this.globalAccess[type], userObj, doc);
            // check if globalAccess gave conclusive result
            if(_.isBoolean(globalResolve)){
                return globalResolve;
            }
        }
        // if not check for local access
        if (doc.access && doc.access[type]) {
            localResolve = this.resolveAccess(doc.access[type], userObj, doc);
            if(_.isBoolean(localResolve)){
                return localResolve;
            }
        }
    }
    // if both global and local access did not give answer then deny access
    return false;
};

Vazco.Access.resolveAccess = function (access, user, doc) {
    var userObj = _.isObject(user) ? user : this._getUser(user);

    if (access) {
        if (_.isObject(access.deny) && this._resolveAll(access.deny, userObj, doc)) {
            // if deny object exist and it is resolved with true then deny access
            return false;
        } else if (_.isObject(access.allow) && this._resolveAll(access.allow, userObj, doc)) {
            // if allow object exist and it is resolved with true then grant access
            return true;
        }
    }
    // if no conclusive answer then return undefined
};

//-------------------- Internal methods -----------------------

Vazco.Access._resolveAll = function (accessObj, userObj, doc){
    var userGroups,
        userId;

    // check special access
    if (_.isArray(accessObj.sa) && this._resolveSA(accessObj.sa, userObj, doc)) {
        return true;
    }
    if(userObj && userObj._id){
        // check user id access
        if (_.isArray(accessObj.user) && this._resolveUser(accessObj.user, userObj._id)) {
            return true;
        }
        // check group id access
        userGroups = this.getGroups(userObj);
        if (_.isArray(accessObj.group) && userGroups && this._resolveGroup(accessObj.group, userGroups)) {
            return true;
        }
    }
    return false;
};

Vazco.Access._resolveSA = function (accessArray, userObj, doc) {
    var self = this;
    return _.some(accessArray, function (access) {
        if (self._SA[access]) {
            return self._SA[access](userObj, doc);
        }
    });
};

Vazco.Access._resolveUser = function (accessArray, userId) {
    return _.contains(accessArray, userId);
};

Vazco.Access._resolveGroup = function (accessArray, userGroups) {
    return _.some(accessArray, function (a) {
        return _.contains(userGroups, a);
    });
};

Vazco.Access._getUser = function (userId) {
    return Meteor.users.findOne({_id: userId});
};

// --------- Allow function you can put as callbacks ----------

Vazco.Access.allowInsertGetFunction = function(Collection){
    return function(userId, doc){
        return Vazco.Access.allowInsert(userId, doc, Collection);
    };
};

Vazco.Access.allowInsert = function(userId, doc, Collection) {
    if (Collection.access && Collection.access.insert) {
        var acs = doc.access;
        doc.access = {
            insert: Collection.access.insert
        };
        var result = this.resolve('insert', doc, userId);
        doc.access = acs;
        return result;
    }
    return false;
};

Vazco.Access.allowShow = function(userId, doc) {
    if (doc.access) {
        return this.resolve('show', doc, userId);
    }
    return false;
};

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
        return _.isObject(userObj);
    },
    owner: function (userObj, doc) {
        return _.isObject(userObj) && _.isObject(doc) && userObj._id === doc.ownerId;
    },
    admin: function (userObj) {
        return _.isObject(userObj) && userObj.is_admin;
    },
    disabled: function (userObj, doc) {
        return _.isObject(doc) && doc.disabled;
    }
};

// ----------- Methods for adding/removing Special access groups -----------

/**
 * Method for setting special access
 * @param {string} id - SA ID (used in access arrays). Eg. everyone, admin,
 * moderators.
 * @param {function} predicateFn - zero to 2 argument function
 * (user object and document). returns boolean
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
        throw new Error('removeSA argument must be string (SA id)');
    }
};

//-------------------- Getters ------------------------

// default getter for user's groups. you can override this with your own
// must return array
Vazco.Access.getGroups = function (userObj) {
    if (userObj) {
        return userObj.access_groups;
    }
};
