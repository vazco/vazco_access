# Vazco Access

Vazco-access allows to set a document level access/permission rules for showing, 
editing and removing documents (or any other actions).

## Access rules

Informations about rules about document are stored inside document itself. 
Rules are stored inside document as an one object named access. 
Each field of access object is an array of strings.
Each string of an array can contain one of three possibilities:

* Special group access ID - special class of access (for ex. 'everyone', 'logged').
* Group ID - Meteor ID of access group.
* User ID - Meteor ID of user.

There are 3 built-in rule arrays:
* 'show' - who can *see* document.
* 'update' - who can *edit* document.
* 'remove' - who can *remove* document.

You can also create your own rule arrays.

### Example of document with access rules:

```js
    _id: 'example'
    access: {
        show: ['logged'],
        update: ['iw0uGrkC3fQxpBJJD', 'moderators', 'FqYIRF60UP2qi8FNi'],
        remove: ['owner', 'QbI4JMTGUG6KzUCUY']
    }
```

This document can be seen by group 'logged', updated by 'iw0uGrkC3fQxpBJJD' 
(which can be user or access group ID) and by group 'moderators' and removed by group 
'owner' and 'QbI4JMTGUG6KzUCUY'.

'logged', 'moderators', 'owner' are special group access IDs. The rest are either user or group IDs.

You can freely combine user IDs, group IDs and special group access IDs.