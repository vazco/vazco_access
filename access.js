Vazco = {};
Vazco.Access = {};

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
                if (Vazco.Access.resolveAccess('show', doc.access, userObj)) {
                    self.added(cursor._getCollectionName(), doc._id, doc);
                }
            }
        });
    }
};

// --------- Allow and deny function you can put as callbacks ----------

Vazco.Access.allowUpdate = function(userId, doc) {
    if (doc.access && doc.access.update) {
        return this.resolveAccessArray(doc.access.update, userId);
    }
    return false;
};

Vazco.Access.denyUpdate = function(userId, doc) {
    if (doc.access && doc.access.update) {
        return !this.resolveAccessArray(doc.access.update, userId);
    }
};

Vazco.Access.allowRemove = function(userId, doc) {
    if (doc.access && doc.access.remove) {
        return this.resolveAccessArray(doc.access.remove, userId);
    }
    return false;
};

Vazco.Access.denyRemove = function(userId, doc) {
    if (doc.access && doc.access.remove) {
        return !this.resolveAccessArray(doc.access.remove, userId);
    }
};

//--------------- Methods for resolving access ------------------

/**
 * Method resolves access based on access object
 * @param {string} type - Type of access to resolve (update, show etc.)
 * @param {Object} accessObj - Document access object.
 * @param {string|Object} user - Either user object or userId.
 */
Vazco.Access.resolveAccess = function(type, accessObj, user) {
    if (accessObj && _.isString('type') && accessObj[type]) {
        return this.resolveAccessArray(accessObj[type], user);
    }
    return false;
};

Vazco.Access.resolveAccessArray = function(accessArray, user) {
    var userObj = this._getUser(user);
    // Check if adminOverride mode is on and override.
    if(this.adminOverride && userObj.admin){
        return true;
    }
    if (accessArray.length > 0) {
        var _accessArray = _.isArray(accessArray) ? accessArray : [accessArray];
        if (this._resolveSAGs(_accessArray, userObj)) {
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

Vazco.Access._getUser = function(user) {
    // If user is string then search for user with this Id.
    return _.isString(user) ? Meteor.users.findOne({_id: user}) : user;
};

Vazco.Access._resolveSAGs = function(accessArray, userObj) {
    var SAGs = _.filter(this._SAGs, function(x) {
        return _.intersection(accessArray, [x.name]).length > 0;
    });
    if (SAGs.length) {
        for (var i = 0; i < SAGs.length; i++) {
            if (this._resolveSAG(SAGs[i], userObj)) {
                return true;
            }
        }
    }
    return false;
};

Vazco.Access._resolveSAG = function(SAG, userObj) {
    return SAG.predicate(userObj);
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

// ------------- Default Special access groups -------------------

Vazco.Access._SAGs = [
    {
        name: 'everyone',
        predicate: function() {
            return true;
        }
    },
    {
        name: 'logged',
        predicate: function(userObj) {
            if (userObj) {
                return true;
            }
            return false;
        }
    }
];

// ----------- Methods for adding/removing Special access groups -----------

/**
 * Method for adding special access group
 * @param {Object} SAG - Object containing fields name (string) and prediacate
 * (function).
 */
Vazco.Access.addSAG = function(SAG) {
    if (_.isObject(SAG)) {
        if (!_.find(this._SAGs, function(x) {
            return x.name === SAG.name;
        })) {
            this._SAGs.push(SAG);
        }
        else {
            throw new Error("SAG " + SAG.name + " already exists.");
        }
    }
    else {
        throw new Error("Special access group (SAG) must be an object.");
    }
};

Vazco.Access.removeSAG = function(SAGName) {
    if (_.isString(SAGName)) {
        var toDel = _.find(this._SAGs, function(x) {
            return x.name === SAGName;
        });
        if (toDel) {
            this._SAGs.pop(toDel);
        }
        else {
            throw new Error("removeSAG can't find " + SAGName);
        }
    }
    else {
        throw new Error("removeSAG argument must be string (SAG name)");
    }
};

//------------------- Variables ---------------

// overrides access check if user doc has boolean "admin" field with value true
// false by default
Vazco.Access.adminOverride = false;