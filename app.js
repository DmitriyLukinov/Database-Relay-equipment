const express = require("express");
const mysql = require('mysql2');
const app = express();
const jsonParser = express.json();
const path = require("path");
const bodyParser = require('body-parser');
require('dotenv').config();
const sbst_fider = require("./server_modules_for_app/sbst_fiders");
const relays = require("./server_modules_for_app/relays_server");
const filter = require("./server_modules_for_app/filter_functions");

app.use(bodyParser.urlencoded({ extended: false })); 

const connection = mysql.createConnection({
    host: process.env.SERVER, 
    user: process.env.DATABASE_USER, 
    password: process.env.DATABASE_PASSWORD, 
    database: process.env.DATABASE 
});

connection.connect((err) => {
    if (err) {
      console.error('Connection error:', err);
      return;
    }
    console.log('Successful database connection');
});

app.get('/dist/bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'bundle.js'));
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/showSubstations", function(req, res){ 
  sbst_fider.showSubstations(connection, res);
});

app.put("/showFiders", jsonParser, function(req, res){
  sbst_fider.showFiders(connection, req, res)
});

app.put("/changeObjectSF", jsonParser, async (req, res)=>{
  sbst_fider.changeObjectSF(connection, req, res);
});

app.put("/deleteObjectSF", jsonParser, async (req, res)=>{
  sbst_fider.deleteObjectSF(connection, req, res);
});



app.put("/showRelays", jsonParser, (req, res)=>{
  relays.showRelays(connection, req, res);
}) 

app.put("/showDropDownRelays", jsonParser, (req, res)=>{
  relays.showDropDownRelays(connection, req, res);
})

app.put("/showDropDownRange", jsonParser, (req, res)=>{
  relays.showDropDownRange(connection, req, res);
})

app.put("/changeRelay", jsonParser, async (req, res) => {
  relays.changeRelay(connection, req, res);
});

app.put("/addRelay", jsonParser, async (req, res)=>{
  relays.addRelay(connection, req, res);
});

app.delete("/deleteRelay", jsonParser, async (req, res)=>{
  relays.deleteRelay(connection, req, res);
});



app.put('/form', jsonParser, async (req, res) => {
  filter.main(connection, req, res);
});

app.listen(443);
