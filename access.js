'use strict';
Vazco.Access = {};

//--------------- Methods for resolving access ------------------

/**
 * Method resolves access based on access object
 * @param {string} type - Type of access to resolve (update, show etc.)
 * @param {Object} doc - Document object.
 * @param {string|Object} user - Either user object or userId.
 */
Vazco.Access.resolve = function(type, doc, user) {
    // Can't do anything if document is disabled.
    if (doc && doc.disabled) {
        return false;
    }
    var userObj = _.isObject(user) ? user : this._getUser(user);
    // Check if adminOverride mode is on and override if user is admin.
    if (this.adminOverride && userObj && userObj.is_admin) {
        return true;
    }
    else if (doc.access && _.isString('type') && doc.access[type]) {
        return this.resolveArray(doc.access[type], userObj, doc);
    }
    return false;
};

Vazco.Access.resolveArray = function(accessArray, user, doc) {
    var userObj = _.isObject(user) ? user : this._getUser(user);
    // Check if adminOverride mode is on and override if user is admin.
    if (this.adminOverride && userObj && userObj.is_admin) {
        return true;
    }
    if (accessArray.length > 0) {
        var _accessArray = _.isArray(accessArray) ? accessArray : [accessArray];
        if (this._resolveSAGs(_accessArray, userObj, doc)) {
            return true;
        }
        if (this._resolveUser(_accessArray, userObj)) {
            return true;
        }
        if (this._resolveGroup(_accessArray, userObj)) {
            return true;
        }
    }
    return false;
};

//-------------------- Internal methods -----------------------

Vazco.Access._getUser = function(userId) {
    return Meteor.users.findOne({_id: userId});
};

Vazco.Access._resolveSAGs = function(accessArray, userObj, doc) {
    var SAGs = _.filter(this._SAGs, function(fn, key) {
        return _.intersection(accessArray, [key]).length > 0;
    });
    if (_.isObject(SAGs) && SAGs.length) {
        for (var prop in SAGs) {
            if (_.has(SAGs, prop) && _.isFunction(SAGs[prop]) && this._resolveSAG(SAGs[prop], userObj, doc)) {
                return true;
            }
        }
    }
    return false;
};

Vazco.Access._resolveSAG = function(predicateFn, userObj, doc) {
    return predicateFn(userObj, doc);
};

Vazco.Access._resolveUser = function(accessArray, userObj) {
    if (userObj && userObj._id) {
        return _.intersection(accessArray, [userObj._id]).length > 0;
    }
    return false;
};

Vazco.Access._resolveGroup = function(accessArray, userObj) {
    if (userObj && userObj.access_groups) {
        return _.intersection(accessArray, userObj.access_groups).length > 0;
    }
    return false;
};

//----------------------- Publish ------------------------

/**
 * Use inside Meteor.publish() callback to send only allowed documents to user.
 * Must be used inside publish callback by call function, like this:
 *
 * Metheor.publish('example', function(){
 *     Vazco.Access.publish.call(this, cursor)
 * }
 *
 * @param {Object|Object[]} cursor - Meteor.Collection.Cursor or array of
 * elements.
 */
Vazco.Access.publish = function(cursor) {
    if (_.isObject(cursor) || _.isArray(cursor)) {
        var self = this;
        var userObj = Meteor.users.findOne({_id: this.userId});
        cursor.forEach(function(doc) {
            if (doc.access) {
                if (Vazco.Access.resolve('show', doc, userObj)) {
                    self.added(cursor._getCollectionName(), doc._id, doc);
                }
            }
        });
    }
};

// --------- Allow function you can put as callbacks ----------

Vazco.Access.allowUpdate = function(userId, doc) {
    if (doc.access && doc.access.update) {
        return this.resolve('update', doc, userId);
    }
    return false;
};

Vazco.Access.allowRemove = function(userId, doc) {
    if (doc.access && doc.access.remove) {
        return this.resolve('remove', doc, userId);
    }
    return false;
};

// ------------- Default Special access groups -------------------

Vazco.Access._SAGs = {
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
        if (_.isObject(userObj) && _.isObject(doc) && userObj._id === doc.ownerId) {
            return true;
        }
        return false;
    },
    admin: function (userObj) {
        if (userObj.is_admin) {
            return true;
        }
        return false;
    }
};

// ----------- Methods for adding/removing Special access groups -----------

/**
 * Method for setting special access group
 * @param {string} id - SAG ID (used in access arrays)
 * @param {function} predicateFn - one atribute function (user object) returns
 * boolean
 */
Vazco.Access.addSAG = function(id, predicateFn) {
    if (_.isString(id) && _.isFunction(predicateFn)) {
        this._SAGs[id] = predicateFn;
    }
    else {
        throw new Error('Wrong parameters');
    }
};

Vazco.Access.removeSAG = function(id) {
    if (_.isString(id)) {
        if(_.isFunction(this._SAGs[id])){
            delete this._SAGs[id];
        }
    }
    else {
        throw new Error("removeSAG argument must be string (SAG id)");
    }
};

//------------------- Variables ---------------

// overrides access check if user doc has boolean "is_admin" field with value true
// false by default
Vazco.Access.adminOverride = false;