# Vazco Access

Vazco-access allows to set a document level access/permission rules for showing, 
editing and removing documents (or any other actions).

## Quick start

Put access object inside document like that:
```js
{
    access: {
        show: ['_id of user who can see document', /*... more if you want ...*/],
        update: ['_id of user who can edit document', /*... more if you want ...*/],
        remove: ['_id of user who can remove document', /*... more if you want ...*/],
    },
    /*
      rest
      of
      document
    */
}
```

###Publishing 

```js
Meteor.publish('example', function() {
    Vazco.Access.publish.call(this, ExampleCollection.find());
    // do not return anything (or at least not ExampleCollection.find())
});
```

This prevent users that are not in the show array from receiving it.

###Allow
```js
ExampleCollection.allow({
    update: Vazco.Access.allowUpdate,
    remove: Vazco.Access.allowRemove,
});
```
This allows users that are in the update array to edit/remove document.

## Access rules

Informations about rules about document are stored inside document itself. 
Rules are stored inside document as an object named access. 
Each field of access object is an array of strings.

There are 3 built-in rule arrays:

1. show - who can **see** document.
2. update - who can **edit** document.
3. remove - who can **remove** document.

You can also create your own rule arrays.

Each string of an array can contain one of three possibilities:

* Special group access ID - special class of access (for ex. 'everyone', 'logged').
* Group ID - Meteor ID of access group.
* User ID - Meteor ID of user.

### Example of document with access rules:

```js
{
    _id: 'example',
    access: {
        show: ['logged'],
        update: ['iw0uGrkC3fQxpBJJD', 'moderators', 'FqYIRF60UP2qi8FNi'],
        remove: ['owner', 'QbI4JMTGUG6KzUCUY']
    }
}
```
**logged**, **moderators**, **owner** means special group access IDs. 

Meteor IDs are either user or group IDs.

You can freely combine user IDs, group IDs and special group access IDs.

## Special group access

Special group access are simply a function that take user as argument an return true or false.

There are 2 built-in special group access: 

**everyone** - every user.

**logged** - every logged user.

You can define your own special group access like this:

```js
/* on server */
Vazco.Access.addSAG(
    {
        name: 'moderators', // ID of group (used in role arrays)
        predicate: function(userObj) { //take one argument: user object
            if (userObj.is_moderator) {
                return true;
            }
            return false;
        }
    }
)
```

## Access groups

User is in an access group if inside user document there is an **access_groups** array containing group's ID. 

Example:
```js
/* user document */
{
    _id: '/* user id */',
    access_groups: ['/* group id */', '/* another group id */']
}
```

There is 