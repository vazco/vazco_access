'use strict';
Vazco.Access = {};

//--------------- Methods for resolving access ------------------

Vazco.Access.resolve = function (type, doc, user, collection) {
    var access = {allow: [], deny: []},
        userObj = this._getUser(user),
        self = this;

    if (_.isString(type)) {
        if (this.globalAccess && this.globalAccess[type]) {
            this._appendAccess(access, this.globalAccess[type]);
        }
        if (collection && collection.access && collection.access[type]) {
            this._appendAccess(access, collection.access[type]);
        }
        if (doc && doc.access && doc.access[type]) {
            this._appendAccess(access, doc.access[type]);
        }

        if (access.deny.length > 0) {
            if (_(access.deny).some(function (acc) {
                return self.resolveSingle(acc, userObj, doc);
            })) {
                return false;
            }
        }

        if (access.allow.length > 0) {
            if (_(access.allow).some(function (acc) {
                return self.resolveSingle(acc, userObj, doc);
            })) {
                return true;
            }
        }
    }
    // if access did not give answer then deny access
    return false;
};

Vazco.Access.resolveAccess = function (access, user, doc) {
    var userObj = this._getUser(user);

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

Vazco.Access.resolveSingle = function (access, user, doc) {
    var userObj = this._getUser(user);

    if (_.isObject(access) && this._resolveAll(access, userObj, doc)) {
        return true;
    }
    return false;
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
    if(_.isObject(userId) && userId._id){
        userId = userId._id;
    }
    var usersColl = Meteor.users;
    if(typeof UniUsers === 'object'){
        usersColl = UniUsers;
    }
    return usersColl.findOne({_id: userId});
};

Vazco.Access._appendAccess = function (accessObj, access) {
    if(access.allow){
        accessObj.allow.push(access.allow);
    }
    if (access.deny){
        accessObj.deny.push(access.deny);
    }
};

// --------- Allow function you can put as callbacks ----------
/**
 *  Returns the function personalized for collection
 * @param Collection
 * @returns {Function} function(userId, doc) but it works only for Collection
 */
Vazco.Access.allowInsertGetFunction = function(Collection){
    return function(userId, doc){
        return Vazco.Access.allowInsert(userId, doc, Collection);
    };
};
/**
 *  Returns "allow update" function personalized for collection
 * @param Collection
 * @returns {Function} function(userId, doc, fieldNames, modifier) but it works only for Collection
 */
Vazco.Access.allowUpdateGetFunction = function(Collection){
    return function(userId, doc, fieldNames, modifier){
        return Vazco.Access.allowUpdate(userId, doc, fieldNames, modifier, Collection);
    };
};
/**
 *  Returns the function personalized for collection
 * @param Collection
 * @returns {Function} function(userId, doc) but it works only for Collection
 */
Vazco.Access.allowRemoveGetFunction = function(Collection){
    return function(userId, doc){
        return Vazco.Access.allowRemove(userId, doc, Collection);
    };
};

Vazco.Access.allowInsert = function(userId, doc, Collection) {
    if ((Collection.access && Collection.access.insert)
        || (_.isArray(this.globalAccess) && this.globalAccess['insert'])) {
        var acs = doc.access;
        doc.access = {
            insert: Vazco.get(Collection, 'access.insert')
        };
        var result = this.resolve('insert', doc, userId);
        doc.access = acs;
        return result;
    }
    return false;
};

Vazco.Access.allowShow = function(userId, doc, Collection) {
    if (doc.access || Collection || (_.isArray(this.globalAccess) && this.globalAccess['show'])) {
        return Vazco.Access.resolve('show', doc, userId, Collection);
    }
    return false;
};

Vazco.Access.allowUpdate = function (userId, doc, fieldNames, modifier, Collection) {
    if (doc.access || Collection || (_.isArray(this.globalAccess) && this.globalAccess['update'])) {
        return Vazco.Access.resolve('update', doc, userId, Collection);
    }
    return false;
};

Vazco.Access.allowRemove = function (userId, doc, Collection) {
    if (doc.access || Collection || (_.isArray(this.globalAccess) && this.globalAccess['remove'])) {
        return Vazco.Access.resolve('remove', doc, userId, Collection);
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

// ---------------- Utils ----------------------------------

Vazco.Access.diff = function (doc1, doc2) {
    var diff = {};
    for (var key in doc1) {
        if (!EJSON.equals(doc1[key],doc2[key])) {
            diff[key] = doc2[key];
        }
    }
    for (var key in doc2) {
        if (!doc1[key]) {
            diff[key] = doc2[key];
        }
    }
    return diff;
};
