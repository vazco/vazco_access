# Vazco Access

Vazco-access allows to set a document level access/permission rules for showing, 
editing and removing documents (or any other actions).

## Quick start

Put access object inside document like this (example):
```js
{
    access: {
        show: {
            allow: {
                sa: ['everyone', 'owner'],
                user: ['LtdsBwrM', '8ywdGv9R']
            },
            deny: {
                sa: ['banned']
            }
        },
        update: {
            allow: {
                sa: ['admin', 'owner'],
                user: ['WxPBhygm']
            },
            deny: {
                group: ['baQ92GmR', 'uySdKPr9']
            }
        },
        remove: {
            allow: {
                sa: ['admin', 'owner']
            }
        }
    }
}
```

###Publishing 

```js
Meteor.publish('example', function() {
    Vazco.Access.publish(
            {
                handle: this,
                collection: ExampleCollection,
                filter: {created_by: 'a897qb'},
                options: {
                          limit: 10,
                          sort: { createdAt: -1 }
                        }
            });
});
```

This function publishes ExampleCollection but you must have show access to receive it. 
Vazco.Access.publish is modified meteor-publish-with-relations method. 
See https://github.com/svasva/meteor-publish-with-relations 

###Allow
```js
ExampleCollection.access = {
    insert: {
        allow: {
            sa: ['everyone']
        },
        deny: {
            group: ['qw32pd']
        }
    }
}
        

ExampleCollection.allow({
    insert: Vazco.Access.allowInsertGetFunction(ExampleCollection),
    update: Vazco.Access.allowUpdate,
    remove: Vazco.Access.allowRemove,
});

or 

ExampleCollection.allow({
    insert: function(userId, doc){
         return Vazco.Access.allowInsert(userId, doc, ExampleCollection);
    },
    update: function(userId, doc){
         return Vazco.Access.allowUpdate(userId, doc);
    },
    remove: function(userId, doc){
         return Vazco.Access.allowRemove(userId, doc);
    }
});
```
Access from document will be used to resolve update and remove access.
For insert you need to specify access object for all collection (like in example above).

## Methods

**Vazco.Access.resolve(type, doc, user);**

Takes action type (string), document and user object or id and resolve access.

Arguments

type {string} - 'show', 'update', 'remove' etc.

doc {object} - document

user {string} - user object or id


## Access object

It always goes like this: 

**access.<insert|show|update|remove|other>.<allow|deny>.<sa[]|user[]|group[]>**

First the action you try to do (show, update, remove, etc.).

There are 4 built-in action object:

1. insert - who can **insert** document into collection.
2. show - who can **see** document.
3. update - who can **edit** document.
4. remove - who can **remove** document.

You can also create your own action object (for download action etc.).

Next the type of access you want to resolve: **allow**, **deny**.

Deny access gets resolved first, then allow if deny don't return answer.

Then there is an sa|user|group array:

* sa - special class of access (for ex. 'everyone', 'logged').
* group - Meteor ID of some group.
* user - Meteor ID of user.

**If document do not have access object or access array you try to check access right will not be granted.**

## Special access

Special access is simply a function that take user and document objects as argument an return true or false.

There are few built-in special group access: 

**everyone** - every user.
**logged** - every logged user.

Check source for more.

You can define your own special access group like this:

```js
Vazco.Access.addSA('is_owner', function(userObj, doc) {
        if (userObj && doc && doc.created_by === userObj._id) {
            return true;
        }
        return false;
    });
```
First argument is special group ID (used in access arrays).

Second is a one argument function, that have to return true if access is granted or false otherwise.
I don't recommend putting any heavy logic inside.

**Predicate function may be called without userObj or doc so you must manually check for it.**

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

You can override default getter that returns access_groups for access resolve.

Default works like this:
```js
Vazco.Access.getGroups = function (userObj) {
    if (userObj) {
        return userObj.access_groups;
    }
};
```

For other project it may be something like this:
```js
Vazco.Access.getGroups = function (userObj) {
    if (userObj) {
        return _.union(userObj.teams, userObj.groups);
    }
};
```

I don't recommend putting any heavy logic inside, especially db queries.

## Global access

You can define global access object for all documents in project.
It work the same as if you put this object manually inside every document in project.

Example:
```js
Vazco.Access.globalAccess = {
        show: {
            allow: {
                sa: ['admin']
            },
            deny: {
                sa: ['disabled']
            }
        }
    };
```

This will allow admin to see all documents and also hide every disabled document form user. 

## Internals

Access is resolved in this order:
**Global access -> Document access**

Inside each of above:
**Deny rules -> Allow rules**

Inside of this:
**Special access rules -> User id rules -> Group id rules**

Resolving will stop when it reach conclusive (deny or allow hit) result.