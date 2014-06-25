Vazco.Access.publish = (params) ->
  pub = params.handle
  collection = params.collection
  associations = {}

  publishAssoc = (collection, filter, options) ->
    collection.find(filter, options).observe

      added: (document) =>
        if Vazco.Access.resolve('show', document, userObj)
          pub.added(collection._name, document._id, document)

      changed: (newDocument, oldDocument) =>
        oldAccess = Vazco.Access.resolve('show', oldDocument, userObj)
        newAccess = Vazco.Access.resolve('show', newDocument, userObj)

        if oldAccess and newAccess
          pub.changed(collection._name, newDocument._id, newDocument)

        else if !oldAccess and newAccess
          pub.added(collection._name, newDocument._id, newDocument)

        else if oldAccess and !newAccess
          pub.removed(collection._name, newDocument._id)

      removed: (oldDocument) =>
        if Vazco.Access.resolve('show', oldDocument, userObj)
          pub.removed(collection._name, oldDocument._id)

  doMapping = (id, obj, mappings) ->
    return unless mappings
    for mapping in mappings
      mapFilter = {}
      mapOptions = {}
      if mapping.reverse
        objKey = mapping.collection._name
        mapFilter[mapping.key] = id
      else
        objKey = mapping.key
        mapFilter._id = obj[mapping.key]
        if _.isArray(mapFilter._id)
          mapFilter._id = {$in: mapFilter._id}
      _.extend(mapFilter, mapping.filter)
      _.extend(mapOptions, mapping.options)
      if mapping.mappings
        Vazco.Access.publish
          handle: pub
          collection: mapping.collection
          filter: mapFilter
          options: mapOptions
          mappings: mapping.mappings
          _noReady: true
      else
        associations[id][objKey]?.stop()
        associations[id][objKey] =
          publishAssoc(mapping.collection, mapFilter, mapOptions)

  filter = params.filter
  options = params.options
  userObj = Meteor.users.findOne(pub.userId)

  collectionHandle = collection.find(filter, options).observe
    added: (document) ->
      if Vazco.Access.resolve('show', document, userObj)
        pub.added(collection._name, document._id, document)
        associations[document._id] ?= {}
        doMapping(document._id, document, params.mappings)

    changed: (newDocument, oldDocument) ->
      oldAccess = Vazco.Access.resolve('show', oldDocument, userObj)
      newAccess = Vazco.Access.resolve('show', newDocument, userObj)

      if oldAccess and newAccess
        _.each newDocument, (value, key) ->
          changedMappings = _.filter params.mappings, (mapping) ->
            mapping.key is key and not mapping.reverse
          doMapping(newDocument._id, newDocument, changedMappings)
        pub.changed(collection._name, newDocument._id, newDocument)

      else if !oldAccess and newAccess
        pub.added(collection._name, newDocument._id, newDocument)
        associations[newDocument._id] ?= {}
        doMapping(newDocument._id, newDocument, params.mappings)

      else if oldAccess and !newAccess
        handle.stop() for handle in associations[newDocument._id]
        pub.removed(collection._name, newDocument._id)

    removed: (oldDocument) ->
      if Vazco.Access.resolve('show', oldDocument, userObj)
        handle.stop() for handle in associations[oldDocument._id]
        pub.removed(collection._name, oldDocument._id)

  pub.ready() unless params._noReady

  pub.onStop ->
    for id, association of associations
      handle.stop() for key, handle of association
    collectionHandle.stop()