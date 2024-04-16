const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require("mysql");
const app = express();
const http = require("http")
const {Server} = require('socket.io')

const db = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'Masina!12',
  database:'football'
})

app.use(bodyParser.json());
const corsOptions = {
  origin:"*",
  credentials:true,
  optionSuccessStatus:200
}
app.use(cors(corsOptions));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

const routes = require('./routes')(db);
app.use(routes);

const server = http.createServer(app)
const io = new Server(server,{
  cors: {
    origin:"*",
    credentials:true,
    optionSuccessStatus:200
  }
});

// setInterval(() => {  playerController.createNewEntity(io);}, Math.floor(Math.random() * 6001) + 10000);
io.on("connection",(socket) => {
  console.log("User connected");
})

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});