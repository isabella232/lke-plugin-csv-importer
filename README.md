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
This plugin allows you to import data into an empty database even if you're not a cypher query language expert: no knowledge of which is required.

The information of nodes and edges need to be stored in a *comma separated file* (also known as *csv* file) separately

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

### 3.1 Structure of the CSV File

#### 3.1.1 Nodes File

1. The filename is the node category.

2. The headers are the node property names.

3. The first column is the node ID and should be named UID.

4. The succeeding columns are the node properties.

#### 3.1.2 Edges File

1. The filename is the edge type.

2. The headers are the edge property names.

3. The first column is the source node ID.

4. The second column is the destination node ID.

5. The succeeding columns are the edge properties.

### 3.2 Import data

1. Open a visualization.

2. Execute the `Import data` custom action.

3. Browse for the CSV file. Click the Upload button.

4. Choose which entity to upload: nodes or edges.

5. Validate that the node category/ edge type name is correct

6. Validate that the property names are correct

7. For edges, input the source node and destination node categories where the edge is connected to.

8. Click import. The result will either be successful, failed, or incomplete.

### 3.3 Import status

1. Successful: All nodes/ edges have been imported.

2. Failed: Nothing has been imported.

3. Incomplete: Some nodes failed to import due to one of the following reasons:

   a. Schema non-compliant data
      The schema type has phone as number, but in the csv the value of phone is a string. Same for date or booleans or other incompatible types

   b. Unexpected properties (in strict schema)
      If the schema type has name and phone, but in your csv you have the headers name, phone, email, then it will fail for email

   c. Missing required properties
      If the schema type has phone as required, but your csv has only name

   d. Too many or missing header values
      Your header has 3 property names, but some rows have less than 3 or more than 3 comma-separated values

   e. Source or target node does not exist

   f. Data-source is not available (including read-only)
      Either is offline or you have no rights to see that datasource

   g. Unauthorized access to the data-source
      Plausible if your session has been revoked)
      
   h. Error unknown
      Default message if error is not known

## 4. Limitations

1. The file size limit is currently set to 80KB.

2. The plugin only allows for CSV format.

3. The node category name, edge type name, and properties cannot be edited from the UI.

## 5. Sample files

Two sample CSV files are available [here](https://github.com/Linkurious/lke-plugin-csv-importer/tree/master/sample%20csv):
- `person.csv` contains information about person entities (a *node*);
- `ping.csv` contains information about relationships between two person nodes (a *relationship*).

All the information contained in these files has been created with [Mockaroo](http://mockaroo.com/): an online tool for creating random and mock datasets.
