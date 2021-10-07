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
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
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
