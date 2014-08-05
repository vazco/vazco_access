Vazco.Access.publish = (params) ->
  pub = params.handle
  collection = params.collection
  associations = {}

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
          publishSimple(mapping.collection, mapFilter, mapOptions)

  addedHandler = (document, collection) ->
    if Vazco.Access.resolve('show', document, userObj, collection)
      pub.added(collection._name, document._id, document)
      true

  changedHandler = (newDocument, oldDocument, collection) ->
    oldAccess = Vazco.Access.resolve('show', oldDocument, userObj, collection)
    if !oldAccess
      return @.added(newDocument)

    newAccess = Vazco.Access.resolve('show', newDocument, userObj, collection)
    if oldAccess and !newAccess
      return @.removed(newDocument)

    if oldAccess and newAccess
      diff = Vazco.Access.diff(oldDocument, newDocument)
      pub.changed(collection._name, newDocument._id, diff)
      true

  removedHandler = (oldDocument, collection) ->
    try
      pub.removed(collection._name, oldDocument._id)

  publishSimple = (collection, filter, options) ->
    collection.find(filter, options).observe
      added: (document) ->
        addedHandler.call(@, document, collection)
      changed: (newDocument, oldDocument) ->
        changedHandler.call(@, newDocument, oldDocument, collection)
      removed: (oldDocument) ->
        removedHandler.call(@, oldDocument, collection)

  filter = params.filter || {}
  options = params.options || {}
  userObj = Meteor.users.findOne(pub.userId)

  if params.mappings
    collectionHandle = collection.find(filter, options).observe
      added: (document) ->
        if addedHandler.call(@, document, collection)
          associations[document._id] ?= {}
          doMapping(document._id, document, params.mappings)

      changed: (newDocument, oldDocument) ->
        if changedHandler.call(@, newDocument, oldDocument, collection)
          _.each newDocument, (value, key) ->
            changedMappings = _.filter params.mappings, (mapping) ->
              mapping.key is key and not mapping.reverse
            doMapping(newDocument._id, newDocument, changedMappings)

      removed: (oldDocument) ->
        if oldDocument
          removedHandler.call(@, oldDocument, collection)
          handle.stop() for handle in associations[oldDocument._id]
  else
    collectionHandle = publishSimple(collection, filter, options)

  pub.ready() unless params._noReady

  pub.onStop ->
    for id, association of associations
      handle.stop() for key, handle of association
    collectionHandle.stop()