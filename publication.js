'use strict';
Vazco.Access.publish = function(params) {
    var addedHandler, associations, changedHandler, collection, limit,
        collectionHandle, doMapping, filter, options, pub, publishSimple, removedHandler, userObj;
    pub = params.handle;
    collection = params.collection;
    associations = {};
    doMapping = function(id, obj, mappings) {
        var mapFilter, mapOptions, mapping, objKey, _i, _len, _ref, _results;
        if (!mappings) {
            return;
        }
        _results = [];
        for (_i = 0, _len = mappings.length; _i < _len; _i++) {
            mapping = mappings[_i];
            mapFilter = {};
            mapOptions = {};
            if (mapping.reverse) {
                objKey = mapping.collection._name;
                mapFilter[mapping.key] = id;
            } else {
                objKey = mapping.key;
                mapFilter._id = obj[mapping.key];
                if (_.isArray(mapFilter._id)) {
                    mapFilter._id = {
                        $in: mapFilter._id
                    };
                }
            }
            _.extend(mapFilter, mapping.filter);
            _.extend(mapOptions, mapping.options);
            if (mapping.mappings) {
                _results.push(Vazco.Access.publish({
                    handle: pub,
                    collection: mapping.collection,
                    filter: mapFilter,
                    options: mapOptions,
                    mappings: mapping.mappings,
                    _noReady: true
                }));
            } else {
                if ((_ref = associations[id][objKey])) {
                    _ref.stop();
                }
                _results.push(associations[id][objKey] = publishSimple(mapping.collection, mapFilter, mapOptions));
            }
        }
        return _results;
    };
    addedHandler = function(document, collection) {
        if (Vazco.Access.resolve('show', document, userObj, collection)) {
            if(pub._ready || (!limit || (limit && this._i <= limit))){
                document._query_limit = limit;
                pub.added(collection._name, document._id, document);
                ++this._i;
                return true;
            }
        }
    };
    changedHandler = function(newDocument, oldDocument, collection) {
        var diff, newAccess;
        if(!pub._documents[collection._name] || !pub._documents[collection._name][newDocument._id]) {
            return addedHandler.call(this, newDocument, collection);
        }
        newAccess = Vazco.Access.resolve('show', newDocument, userObj, collection);
        if (!newAccess) {
            return removedHandler.call(this, newDocument, collection);
        }
        if (newAccess) {
            diff = Vazco.Access.diff(oldDocument, newDocument);
            pub.changed(collection._name, newDocument._id, diff);
            return true;
        }
    };
    removedHandler = function(oldDocument, collection) {
        if(!pub._documents[collection._name] || !pub._documents[collection._name][oldDocument._id]) {
            return;
        }
//        --this._i; // I don't know if decrement is good option
//        try {
            return pub.removed(collection._name, oldDocument._id);
//        } catch (_error) {}
    };
    publishSimple = function(collection, filter, options) {
        return collection.find(filter, options).observe({
            _i:0,
            added: function(document) {
                return addedHandler.call(this, document, collection);
            },
            changed: function(newDocument, oldDocument) {
                return changedHandler.call(this, newDocument, oldDocument, collection);
            },
            removed: function(oldDocument) {
                return removedHandler.call(this, oldDocument, collection);
            }
        });
    };
    filter = params.filter || {};
    options = params.options || {};
    if(options.limit){
        limit = options.limit;
        delete options.limit;
    }
    userObj = Meteor.users.findOne(pub.userId);
    if (params.mappings) {
        collectionHandle = collection.find(filter, options).observe({
            _i:0,
            added: function(document) {
                var _name;
                if (addedHandler.call(this, document, collection)) {
                    if (!associations[_name = document._id]) {
                        associations[_name] = {};
                    }
                    return doMapping(document._id, document, params.mappings);
                }
            },
            changed: function(newDocument, oldDocument) {
                if (changedHandler.call(this, newDocument, oldDocument, collection)) {
                    return _.each(newDocument, function(value, key) {
                        var changedMappings;
                        changedMappings = _.filter(params.mappings, function(mapping) {
                            return mapping.key === key && !mapping.reverse;
                        });
                        return doMapping(newDocument._id, newDocument, changedMappings);
                    });
                }
            },
            removed: function(oldDocument) {
                var handle, _i, _len, _ref, _results;
                if (oldDocument) {
                    removedHandler.call(this, oldDocument, collection);
                    _ref = associations[oldDocument._id];
                    _results = [];
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        handle = _ref[_i];
                        _results.push(handle.stop());
                    }
                    return _results;
                }
            }
        });
    } else {
        collectionHandle = publishSimple(collection, filter, options);
    }
    if (!params._noReady) {
        pub.ready();
    }
    return pub.onStop(function() {
        var association, handle, id, key;
        for (id in associations) {
            association = associations[id];
            for (key in association) {
                handle = association[key];
                handle.stop();
            }
        }
        return collectionHandle.stop();
    });
};