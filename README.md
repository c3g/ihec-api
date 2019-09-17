

## Install

 - Install NodeJS version 8
 - Then, from the root folder of the project:

    ```
    $ cd source_code/
    $ mkdir data
    $ cd scripts
    $ PORT=10081 node ./generate-data.js
    $ cd ../edcc_portal/api
    $ npm install
    $ sudo a2enmod proxy proxy_http
    $ sudo apachectl restart
    ```

 - Next, add the following line to your httpd.conf:

    `ProxyPass /api http://localhost:8000`

 - Finally, run the SQL script
     `source_code/scripts/edccdc/migration/1.7.0_to_1.8.0.sql`.
   (or the statement
   `INSERT INTO institution (name, short_name, color)
                     VALUES ('Other', 'Other', 'CC1A7F')`)

## Starting the NodeJS backend

```
$ cd source_code/edcc_portal/api

Either:
$ node index.js

Or (for Ubuntu):
$ nodejs index.js
```
# ihec-api
