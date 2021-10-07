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
