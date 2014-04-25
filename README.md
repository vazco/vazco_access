# Vazco Access

Vazco-access allows to set a document level access/permission rules for showing, 
editing and removing documents (or any other actions).

## Quick start

Put access object inside document like this:
```js
{
    access: {
        show: ['_id of user/group who can see document', /*... more ...*/],
        update: ['_id of user/group who can edit document', /*... more ...*/],
        remove: ['_id of user/group who can remove document', /*... more ...*/],
    },
    /*rest
    * of
    * document
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

This function publishes ExampleCollection but you must be in show array to receive it.

###Allow
```js
ExampleCollection.allow({
    update: Vazco.Access.allowUpdate,
    remove: Vazco.Access.allowRemove,
});
```
This allows users that are in the update array to edit/remove document.

###Access methods
```js
ExampleCollection.allow({
    insert: function(userId) {
        return Vazco.Access.resolveArray(['some_user_id','some_group_id'], userId);
    }
});
```

You can use access methods to check permissions outside build in functions.
In this example you can give insert rights for collection for users/groups from array.

## Access arrays

Informations about rules about document are stored inside document itself. 
Access rules are stored inside document as an object named access. 
Each field of access object is an array of strings.

There are 3 built-in access arrays:

1. show - who can **see** document.
2. update - who can **edit** document.
3. remove - who can **remove** document.

You can also create your own access arrays.

Each string in access array can contain one of three possibilities:

* Special group access ID - special class of access (for ex. 'everyone', 'logged').
* Group ID - Meteor ID of access group.
* User ID - Meteor ID of user.

**If document do not have access object or access array you try to check access right will not be granted.**

### Example of document with access arrays:

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

You can define your own special access group like this:

```js
Vazco.Access.addSAG('moderators', function(userObj) {
        if (userObj && userObj.is_moderator) {
            return true;
        }
        return false;
    });
```
First argument is special group ID (used in access arrays).

Second is a one argument function (takes user object), that have to return true if access is granted or false otherwise.
**Predicate function may be called without userObj so you must manually check if userObj exist.**

## Access groups

User is in an access group if inside user document there is an **access_groups** array containing group's ID. 

Example:
```js
/* user document */
{
    _id: '/* user id */',
    access_groups: ['group_id', 'another_group_id']
}
```

There is no requirements about access groups, as long as you put the same ID in access array and access_groups array.

## Disabled documents

If you put **disabled: true** flag on document it will always return false on any access check.
It will not be send to user (even with admin flag) and you will not be able to edit/remove it.

## Admin override mode

To activate admin override mode, put this somewhere on the server:

```js
Vazco.Access.adminOverride = true;
```

Now every user with flag **admin: true** can skip access check.

## Methods

###Vazco.Access.resolveArray(access_array, user_object_or_ID)

Returns true or false.

To use outside built in function.

###Vazco.Access.resolve(type, document, user_object_or_ID)

Returns true or false.

**type** - is an string corresponding to field in access object (show, update, remove etc.) 
**document** - document with access object (if not present this will return false)

Same as resolveArray but for use with documents.