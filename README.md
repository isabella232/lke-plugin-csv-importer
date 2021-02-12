# CSV Importer Plugin for Linkurious Enterprise (ALPHA)

Feedbacks or bugs? Please, [contact us](mailto:support@linkurio.us)

### Prerequisites:
- a  Linkurious Enterprise 2.9.x server

## Topics:
1. [Introduction](#1-introduction)

2. [Installation](#2-installation)
    1. [Setting the Plugin](#21-setting-the-plugin)
    2. [Setting the Custom Action](#22-setting-the-custom-action)

3. [How to import data](#3-how-to-import-data)

4. [Sample files](#4-sample-files)

## 1. Introduction
With this plugin, we want to provide an easy tool for importing data into your datasource, even if you're not a cypher query language expert: no knowledge is required.

The information of nodes and edges need to be stored in a *comma separated file* (also known as *csv* file); every single line of the file should follow this syntax:

```
property_1,property_2,...,property_n
```

where `property_x` is:
- a `number`: an integer or a float (`.` must be used as decimal separator);
- a `string`: they can be defined with or without `"` (or `'`) delimiters;
- a `date` (or `datetime`);
- a `boolean`;

NOTE: regardless of the type, at the moment it's not possible to include a `,` in the value of a property.

It's possible to include an *header* containing the names of the property. The header must be the first line of the file and it follow the same syntax as the property values.

Example: *sample.csv*

```
first_name,last_name,age,country
Roosvelt,Anderson,42,"US"
Julianne,Redmond,35,"GB"
Ginevra,Spacey,87,"AU"
```

## 2. Installation

### 2.1 Setting the Plugin
NOTE: for this part you need admin rights.

1. Download the `importer.lke` plugin available [here](https://github.com/Linkurious/lke-plugin-csv-importer/releases/tag/v1.0.0).

2. Copy the `.lke` archive in the folder `<lke-server>/data/plugins`

3. On Linkurious Enterprise dashboard, go to `Admin` -> `Global configuration`

4. Scroll to the `Plugin settings` field

5. If there are no other plugins configured here, replace the whole content of the field with the following code and skip to step 7. \
Otherwise, go to step 6

    ```json
    {
        "importer": {
            "basePath": "importer"
        }
    }
    ```

6. On the `Plugin settings` field, add an new empty line before the last `}`, add in this line a comma (`,`) and, after the comma, paste the following code:

    ```json
    "importer": {
        "basePath": "importer"
    }
    ```

7. Click on `Save`

8. Done!

### 2.2 Setting the Custom Action

1. Open the *Custom action* panel (more information [here](https://doc.linkurio.us/user-manual/latest/custom-actions/#managing-custom-actions))

2. Click on `NEW CUSTOM ACTION`

3. Fill the `Custom action name` field with the following text: `Import data` 

4. Fill the `URL template` field with the following URL: `{{baseurl}}plugins/importer/index.html?sourceKey={{sourcekey}}`

5. (Optional) Share the Custom Action with all the users

6. Click on `SAVE`

7. Done!

## 3. How to import data

1. Open a visualization

2. Execute the `Import data` custom action

3. Select the *csv* file from your computer and select the checkbox if this contains an *header*

4. Click on `Load this file`

5. If the loaded file contains Nodes, click on `Add a Node`, otherwise click on `Add an Edge` \
NOTE: it's possible to add multiple nodes categories and edges types at the same time

6. Set a label for the Node (or Edge)

7. If necessary, add or remove some properties

8. If necessary, adjust the mappings: select the correct column and give it the desired name

9. In case of edges, select the correct identifiers for the source and destination nodes

10. Click on `Run`

11. After the execution, click on `Load another CSV` if you need to import another file, or click on `Index datasource` to be redirected to Linkurious Enterprise

12. Done!

## 4. Sample files

Two sample CSV files are available [here](https://github.com/Linkurious/lke-plugin-csv-importer/tree/master/sample%20csv):
- `person.csv` contains information about person entities (a *node*);
- `ping.csv` contains information about relationships between two person nodes (a *relationship*).

All the information contained in these files has been created with [Mockaroo](http://mockaroo.com/): an online tool for creating random and mock datasets.