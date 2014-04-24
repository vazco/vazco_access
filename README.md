# Vazco Access

Vazco-access allows to set a document level access/permission rules for showing, 
editing and removing documents (or any other actions).

# Access rules
Informations about rules about document are stored inside document itself. 
Rules are stored as an array of strings. Each string can contain one of three 
possibilities:

* Special group access ID - 
* Group ID
* User ID

There are 3 built-in rules:
* 'show' - 