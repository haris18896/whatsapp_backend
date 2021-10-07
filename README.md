# Whatsapp Backend

### * don't add this Folder inside the frontend, for taking everything on GitHub I will be pushing it along with frontend, but to use this repository, you need to add this folder `backend_whatsapp` to your root directory and not to the frontend folder.


---
---

add `.gitignore` file.

```sh
git init
npm init
```
* the entry point has to be `server.js` in the `npm init`
* add `'type': 'module'` and `'start' : 'node server.js'` to package.json 


```sh
npm i --save express
npm i --save mongoose
npm i --save cors
npm i --save nodemon
```

* `nodemon` is for development mode to start the server, it will restart the server when you make changes to the code. and the `node server.js` is for production, so we have to use `'start': 'node server.js'` in package.json
* change the `'start': 'node server.js'` to `'start`: `'nodemon server.js'` in package.json for development mode for production change it back. for development mode run `nodemon --inspect server.js`, this way the nodemon will check the `package.json` for the nodemon and will start the server, if there is no `nodemon` in the package.josn file the app will be crashed for the development mode.
* 
---
---

### `server.js`
create a file `server.js` in the backend directory.

```js
// /backend_whatsapp/server.js
import Express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// app config
const app = Express();
const port = process.env.PORT || 9000;
// middleWares
app.use(cors());
app.use(Express.json());

// DB config
const connection_url = "mongodb+srv://admin:eHKDdaLTWepRq@cluster0.clfef.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(connection_url,
        async(err) => {
            if(err) throw err;
            console.log("DB connected");
        }
    )

// entry points
app.get('/', (req, res) => {res.status(200).send('Hello World');});


// listener
app.listen(port, () => {console.log(`Server is running on port ${port}`);})
```

---

### `Setup Mongoose DB`

1. register your mongoose DB account
2. create project
3. create db cluster
4. Add network access 
5. add database access to the cluster
6. connect to the cluster
7. add the string to the `connection_url` variable in the server.js file
8. create a file `dbModel.js` in the backend directory

---
---

```js
// /backend/dbModel.js
import mongoose from 'mongoose';

const whatsappSchema = new mongoose.Schema({
    message: String,
    name: String,
    timestamp: String
});


export default mongoose.model('messageContent',  whatsappSchema);
```

```js
// /backend/server.js
import Express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Messages from './dbModel.js'

// app config
const app = Express();
const port = process.env.PORT || 9000;
// middleWares
app.use(cors());
app.use(Express.json());

// DB config
const connection_url = "mongodb+srv://admin:eH2KDdLDaLTWepRq@cluster0.clfef.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(connection_url,
        async(err) => {
            if(err) throw err;
            console.log("DB connected");
        }
    )

// entry points
app.get('/', (req, res) => {res.status(200).send('Hello World');});

app.post('/messages/new/', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    })
})

app.get('/messages/sync', (req, res) => {
    Messages.find({}, (err, data) => {
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
}
)

// listener
app.listen(port, () => {console.log(`Server is running on port ${port}`);})
```


---
---

## `PUSHER`


`npm i pusher`

1. go  to the Pusher.com
2. register your account
3. click on `Channel`
4. add project name
5. select `eu(Europe)`
6. select front end language
7. select backend language


* it will give us all the codes automatically, specially for the backend.
* we will also be using MongoDB change stream with Pusher.
* the change stream will trigger the pusher and it's going to upload the message to the pusher.


###### `using pusher isn't a best practice`
because you will have to press the refresh button every time, or auto refreshing after every 5 or 10 seconds.
so it's not a best tool.

```js
// /backend/server.js
//......
import Messages from './dbModel.js';
import Pusher from 'pusher';

// app config
const app = Express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1278499",
    key: "5656d95bb85395c320d8",
    secret: "650171a972c2d809b964",
    cluster: "eu",
    useTLS: true
  });
// middleWares
//......
```

Now we are going to add the `MongoDB change stream`.

change stream is going to watch our database, and if there is a change it will trigger `Pusher`.

* in mongoDB the data collection name is in lower case so change the collection name in the dbModel. and as we are exporting it as a default so we don't have to change the other mongoose functions.

```js
// dbModel.js
import mongoose from 'mongoose';

const whatsappSchema = new mongoose.Schema({
    message: String,
    name: String,
    timestamp: String,
    received: Boolean
});


export default mongoose.model('messages',  whatsappSchema);
```

```js
// /server.js
mongoose.connect(connection_url,
        async(err) => {
            if(err) throw err;
            console.log("DB connected");
        }
    )

const db = mongoose.connection;

db.once('open', () => {
    console.log("DB connected to the app");
    const msgCollection = db.collection('messages');    // 'messages' is our collection in the dbModel, but here it's in the lower case because in the mongo db it's going to be in lower case.
    const changeStream = msgCollection.watch();

    // fire change stream is something is
    changeStream.on('change', (change) => {
        console.log(change);
    })
})
```

now go to the PostMan, and send a new message. `console.log(change)` will show the message in the console and in the terminal.

```js
// /backend/server.js
db.once('open', () => {
    console.log("DB connected to the app");
    const msgCollection = db.collection('messages');    // 'messages' is our collection in the dbModel, but here it's in the lower case because in the mongo db it's going to be in lower case.
    const changeStream = msgCollection.watch();

    // fire change stream is something is
    changeStream.on('change', (change) => {
        // console.log(change);
        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
            });
        }else{
            console.log("Error triggering in Pusher ");
        }
    });
});
```

---
---

```js
// /backend/server.js
import Express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Messages from './dbModel.js';
import Pusher from 'pusher';

// app config
const app = Express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1278499",
    key: "5656d95bb85395c320d8",
    secret: "650171a972c2d809b964",
    cluster: "eu",
    useTLS: true
  });
// middleWares
app.use(cors());
app.use(Express.json());

// DB config
const connection_url = "mongodb+srv://admin:eH2KDdLDaLTWepRq@cluster0.clfef.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(connection_url,
        async(err) => {
            if(err) throw err;
            console.log("DB connected");
        }
    )

const db = mongoose.connection;

db.once('open', () => {
    console.log("DB connected to the app");
    const msgCollection = db.collection('messages');    // 'messages' is our collection in the dbModel, but here it's in the lower case because in the mongo db it's going to be in lower case.
    const changeStream = msgCollection.watch();

    // fire change stream is something is
    changeStream.on('change', (change) => {
        // console.log(change);
        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
            });
        }else{
            console.log("Error triggering in Pusher ");
        }
    });
});

// entry points
app.get('/', (req, res) => {res.status(200).send('Hello World');});

app.post('/messages/new/', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    })
})

app.get('/messages/sync', (req, res) => {
    Messages.find({}, (err, data) => {
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
}
)


// listener
app.listen(port, () => {console.log(`Server is running on port ${port}`);})
```