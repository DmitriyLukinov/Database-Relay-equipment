const express = require("express");
const mysql = require('mysql2');
const app = express();
const jsonParser = express.json();
const path = require("path");
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false })); // Разрешаем разбор application/x-www-form-urlencoded

const connection = mysql.createConnection({
    host: process.env.SERVER, 
    user: process.env.DATABASE_USER, 
    password: process.env.DATABASE_PASSWORD, 
    database: 'all_equipment' 
});

connection.connect((err) => {
    if (err) {
      console.error('Connection error:', err);
      return;
    }
    console.log('Successful database connection');
});

// Указываем путь к dist/bundle.js как отдельный файл
app.get('/dist/bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'bundle.js'));
});

app.use(express.static(path.join(__dirname, "public")));

function sendSQLres(string, arr, res){
  connection.query(string, arr, (err, result)=>{
    if (err) {
      console.error("Ошибка выполнения SQL-запроса:", err);
      return;
    }
    res.json(result);
  })
}

app.get("/showSubstations", function(req, res){ 
    const sql = "select distinct substation from substation;";
  sendSQLres(sql, [], res); 
})

app.put("/showFiders", jsonParser, function(req, res){
  const substation = req.body.substation;
  const sql_searchFiders = "select distinct fider from substation where substation = ?";
  const sql_values = [substation];

  sendSQLres(sql_searchFiders, sql_values, res);
})

const sql_currentRelays = "select substation, fider, relay_type, ac_dc, relay_current, year, quantity"+
" FROM substation"+
" JOIN substation_current_relay ON substation_current_relay.fider_id = substation.id"+
" JOIN current_relay ON current_relay_id = current_relay.id"+
" WHERE substation = ? AND fider = ? ORDER BY relay_type";
const sql_voltageRelays = "SELECT substation, fider, relay_type, ac_dc, relay_voltage, year, quantity" +
" FROM substation"+
" JOIN substation_voltage_relay ON fider_id = substation.id"+
" JOIN voltage_relay ON voltage_relay_id = voltage_relay.id"+
" WHERE substation = ? AND fider = ? ORDER BY relay_type";
const sql_measureInstruments = "SELECT substation, fider, device, device_type, measurement_limit, year, quantity,"+
" DATE_FORMAT(next_verification, '%d.%m.%Y') AS formatted_next_verification" +
" FROM substation" +
" JOIN substation_measuring_instruments ON fider_id = substation.id" +
" JOIN measuring_instruments ON measuring_instrument_id = measuring_instruments.id" +
" WHERE substation = ? AND fider = ?";
const sql_currentTranses = "SELECT substation, fider, type, coil_05, coil_10p, year, quantity" + 
" FROM substation" +
" JOIN substation_current_transformers ON fider_id = substation.id"+
" JOIN current_transformers ON current_transformer_id = current_transformers.id"+
" WHERE substation = ? AND fider = ?";

app.put("/showRelays", jsonParser, (req, res)=>{
  const fider = req.body.fider;
  const substation = req.body.substation;

  const sql_values = [substation, fider];

  Promise.all([
    new Promise((resolve, reject)=>{                             
      connection.query(sql_currentRelays, sql_values, (err, result)=>{sql_result(resolve,reject,err,result)});
    }),
    new Promise((resolve, reject)=>{                             
      connection.query(sql_voltageRelays, sql_values, (err, result)=>{sql_result(resolve,reject,err,result)});
    }),
    new Promise((resolve, reject)=>{                             
      connection.query(sql_measureInstruments, sql_values, (err, result)=>{sql_result(resolve,reject,err,result)});
    }),
    new Promise((resolve, reject)=>{                             
      connection.query(sql_currentTranses, sql_values, (err, result)=>{sql_result(resolve,reject,err,result)});
    }) 
  ]).then((value)=>{res.json(value)});
}) 

app.put("/showDropDownRelays", jsonParser, (req, res)=>{
  const tableID = req.body.table;
  const colunmID = req.body.column;
  if(tableID==='currentTable'){
    let sql_dropDownRelays = "SELECT DISTINCT relay_type FROM current_relay";
    sendSQLres(sql_dropDownRelays, [], res);
  }
  if(tableID==='voltageTable'){
    let sql_dropDownRelays = "SELECT DISTINCT relay_type FROM voltage_relay";
    sendSQLres(sql_dropDownRelays, [], res);
  }
  if(tableID==='measuringTable' && colunmID===2){
    let sql_dropDownDevices = "SELECT DISTINCT device FROM measuring_instruments";
    sendSQLres(sql_dropDownDevices, [], res);
  }
  if(tableID==='measuringTable' && colunmID===3){
    let sql_dropDownDevices = "SELECT DISTINCT device_type FROM measuring_instruments";
    sendSQLres(sql_dropDownDevices, [], res);
  }
  if(tableID==='transTable'){
    let sql_dropDownDevices = "SELECT DISTINCT type FROM current_transformers";
    sendSQLres(sql_dropDownDevices, [], res);
  }
})

app.put("/showDropDownRange", jsonParser, (req, res)=>{
  const tableID = req.body.table;
  if(tableID==='currentTable'){
    let sql_dropDownRelays = "SELECT DISTINCT relay_current FROM current_relay ORDER BY relay_current desc";
    sendSQLres(sql_dropDownRelays, [], res);
  }
  if(tableID==='measuringTable'){
    let sql_dropDownRelays = "SELECT DISTINCT measurement_limit FROM measuring_instruments ORDER BY measurement_limit desc";
    sendSQLres(sql_dropDownRelays, [], res);
  }
  if(tableID==='transTable'){
    let sql_dropDownRelays = "SELECT coil_05 AS coils FROM current_transformers UNION SELECT coil_10p AS coils FROM current_transformers "+
    "ORDER BY coils";
    sendSQLres(sql_dropDownRelays, [], res);
  }
})

let sql_result = (resolve, reject, err, result)=>{
  if (err) {
    console.error("Ошибка выполнения SQL-запроса:", err);
    reject(err);
  } else {
    resolve(result);
  }
}

async function addNewTie_substation_current_relay(sbstFiderID, relayID, tableID){
  const sql_fiderNewRelay = [sbstFiderID, relayID];
  const sql_insertChangedCurrentRelay = "INSERT INTO substation_current_relay(fider_id, current_relay_id) VALUES(?,?)";
  const sql_insertChangedVoltageRelay = "INSERT INTO substation_voltage_relay(fider_id, voltage_relay_id) VALUES(?,?)";
  const sql_insertChangedMeasuringInstrument = "INSERT INTO substation_measuring_instruments(fider_id, measuring_instrument_id) VALUES(?,?)"
  const sql_insertChangedCurrentTrans = "INSERT INTO substation_current_transformers(fider_id, current_transformer_id) VALUES(?,?)";
  let sql_insertChangedRelay;
  if(tableID === 'currentTable') {sql_insertChangedRelay = sql_insertChangedCurrentRelay;}
  if(tableID === 'voltageTable') {sql_insertChangedRelay = sql_insertChangedVoltageRelay;}
  if(tableID === 'measuringTable') {sql_insertChangedRelay = sql_insertChangedMeasuringInstrument;}
  if(tableID === 'transTable') {sql_insertChangedRelay = sql_insertChangedCurrentTrans;}

  const newRelay = await new Promise((resolve, reject)=>{                             //Добавляем новую связь
    connection.query(sql_insertChangedRelay, sql_fiderNewRelay, (err, result)=>sql_result(resolve,reject,err,result));
  });
}
async function deleteOldTie_substation_current_relay(sbstFiderID, relayID, tableID){
  const sql_fiderOldRelay = [sbstFiderID, relayID];
  const sql_deleteItitCurrentRelay = "DELETE FROM substation_current_relay WHERE fider_id = ? AND current_relay_id =?";
  const sql_deleteItitVoltageRelay = "DELETE FROM substation_voltage_relay WHERE fider_id = ? AND voltage_relay_id =?";
  const sql_deleteInitMeasuringInstrument = "DELETE FROM substation_measuring_instruments WHERE fider_id = ? AND measuring_instrument_id =?";
  const sql_deleteInitCurrentTrans = "DELETE FROM substation_current_transformers WHERE fider_id = ? AND current_transformer_id =?"
  let sql_deleteItitRelay;
  if(tableID === 'currentTable') {sql_deleteItitRelay = sql_deleteItitCurrentRelay;}
  if(tableID === 'voltageTable') {sql_deleteItitRelay = sql_deleteItitVoltageRelay;}
  if(tableID === 'measuringTable') {sql_deleteItitRelay = sql_deleteInitMeasuringInstrument;}
  if(tableID === 'transTable') {sql_deleteItitRelay = sql_deleteInitCurrentTrans;}
  const oldRelay = await new Promise((resolve, reject)=>{                             //Удаляем старую связь
    connection.query(sql_deleteItitRelay, sql_fiderOldRelay, (err, result)=>sql_result(resolve,reject,err,result));
  });
}
async function tableCorrection(tableID){
  const checkReminder = await new Promise((resolve, reject)=>{            //Проверяем, сколько ещё таких реле такого кол-ва осталось
    connection.query('SELECT*FROM trigger_result', (err, result)=>sql_result(resolve,reject,err,result));
  });

  const sql_dropCurrentRelay = "DELETE FROM current_relay WHERE id=?";
  const sql_dropVoltageRelay = "DELETE FROM voltage_relay WHERE id=?";
  const sql_dropMeasuringInstrument = "DELETE FROM measuring_instruments WHERE id=?";
  const sql_dropCurrentTrans = "DELETE FROM current_transformers WHERE id=?";
  let sql_dropRelay;
  
  if(checkReminder[0].item===0){                                          //Если таких реле больше нет, удаляем из таблицы токовых реле
    if(tableID === 'currentTable') {sql_dropRelay = sql_dropCurrentRelay;}
    if(tableID === 'voltageTable') {sql_dropRelay = sql_dropVoltageRelay;}
    if(tableID === 'measuringTable') {sql_dropRelay = sql_dropMeasuringInstrument;}
    if(tableID === 'transTable') {sql_dropRelay = sql_dropCurrentTrans;}
    const dropRelay = await new Promise((resolve, reject)=>{
      connection.query(sql_dropRelay, checkReminder[0].id, (err, result)=>sql_result(resolve,reject,err,result));
    });
  }
}
function sendRelays(substation, fider, tableID, res){
  let sql_searchRelays;
  if(tableID === 'currentTable') {sql_searchRelays = sql_currentRelays;}
  if(tableID === 'voltageTable') {sql_searchRelays = sql_voltageRelays;}
  if(tableID === 'measuringTable') {sql_searchRelays = sql_measureInstruments;}
  if(tableID === 'transTable') {sql_searchRelays = sql_currentTranses;}
  const sql_values = [substation, fider];

  sendSQLres(sql_searchRelays, sql_values, res);
}
async function searchRelayID(data, tableID){
  const sql_searchCurrentRelay = "SELECT id FROM current_relay " + 
  "WHERE relay_type = ? AND ac_dc = ? AND ABS(relay_current - ?) < 0.001 AND year = ? AND quantity = ?";
  const sql_searchVoltageRelay = "SELECT id FROM voltage_relay " + 
  "WHERE relay_type = ? AND ac_dc = ? AND ABS(relay_voltage - ?) < 0.001 AND year = ? AND quantity = ?";
  const sql_searchMeasuringInstrument = "SELECT id FROM measuring_instruments " +
  "WHERE device = ? AND device_type = ? AND measurement_limit = ? AND year = ? AND quantity = ? AND next_verification = ?";
  const sql_searchCurrentTrans = "SELECT id FROM current_transformers " +
  "WHERE type = ? AND coil_05 = ? AND coil_10p = ? AND year = ? AND quantity = ?";

  let sql_searchRelay;
  if(tableID === 'currentTable') {sql_searchRelay = sql_searchCurrentRelay;}
  if(tableID === 'voltageTable') {sql_searchRelay = sql_searchVoltageRelay;}
  if(tableID === 'measuringTable') {sql_searchRelay = sql_searchMeasuringInstrument;}
  if(tableID === 'transTable') {sql_searchRelay = sql_searchCurrentTrans;}

  if(data[5]!==undefined){
    let sql_date = data[5][6]+data[5][7]+data[5][8]+data[5][9]+'-'+data[5][3]+data[5][4]+'-'+data[5][0]+data[5][1];
    data[5]=sql_date;
  }
  const sql_RelayValues = [data[0],data[1],data[2],data[3],data[4],data[5]];
  const currentRelayID = await new Promise((resolve, reject) => {                    // Ищем ID нового реле в базе
    connection.query(sql_searchRelay, sql_RelayValues, (err, result)=>sql_result(resolve,reject,err,result));
  });
  return currentRelayID;
}

app.put("/changeRelay", jsonParser, async (req, res) => {
  const initData = req.body.initData;
  const changedData = req.body.changedData;
  const tableID = req.body.tableID;
  const substation = req.body.substation;
  const fider = req.body.fider;

  if (initData[0] !== changedData[0] || initData[1] !== changedData[1] || initData[2] !== changedData[2] || initData[3] !== changedData[3] || initData[4] !== changedData[4] || initData[5] !== changedData[5]){
 
    const currentNewRelayID = await searchRelayID(changedData, tableID); // Ищем ID нового реле в базе
    const currentOldRelayID = await searchRelayID(initData, tableID);    //Ищем  ID старого реле в базе

    const sql_searchSbstFider = "SELECT id FROM substation WHERE substation =? and fider =?";
    const sql_SbstFiderValues = [substation, fider];
    const sbstFiderID = await new Promise((resolve, reject)=>{                            //Ищем ID фидера и подстанции, где меняем реле
      connection.query(sql_searchSbstFider, sql_SbstFiderValues, (err,result)=>sql_result(resolve,reject,err,result));
    });

    console.log(`currentOldRelayID = ${currentOldRelayID}`);
    console.log(`currentOldRelayID = ${currentOldRelayID[0].id}`);

    if(currentNewRelayID.length>0){                   //Если новое реле уже есть в current_relay
      addNewTie_substation_current_relay(sbstFiderID[0].id, currentNewRelayID[0].id, tableID);                      //Добавляем новую связь
      deleteOldTie_substation_current_relay(sbstFiderID[0].id, currentOldRelayID[0].id, tableID);                           //Удаляем старую связь
      tableCorrection(tableID);
      sendRelays(substation, fider, tableID, res);
    } 
    else{                                             //если нет такого реле в current_relay
      let sql_addRelay;
      let sql_relay;
      if(tableID==="currentTable"){
        sql_addRelay = "INSERT INTO current_relay (relay_type, ac_dc, relay_current, year, quantity) VALUES (?,?,?,?,?)";
        sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4]];
      }
      if(tableID==="voltageTable"){
        sql_addRelay = "INSERT INTO voltage_relay (relay_type, ac_dc, relay_voltage, year, quantity) VALUES (?,?,?,?,?)";
        sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4]];
      }
      if(tableID === 'measuringTable'){
        sql_addRelay = "INSERT INTO measuring_instruments (device, device_type, measurement_limit, year, quantity, next_verification) VALUES (?,?,?,?,?,?)";
        sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4], changedData[5]];
      }
      if(tableID === 'transTable'){
        sql_addRelay = "INSERT INTO current_transformers (type, coil_05, coil_10p, year, quantity) VALUES (?,?,?,?,?)";
        sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4]];
      }
      const new_current_relayID = await new Promise((resolve, reject)=>{                               //Добавляем новое реле в таблицу токовых реле
        connection.query(sql_addRelay, sql_relay, (err, result)=>sql_result(resolve,reject,err,result));
      });

      addNewTie_substation_current_relay(sbstFiderID[0].id, new_current_relayID.insertId, tableID);                 //Добавляем новую связь
      deleteOldTie_substation_current_relay(sbstFiderID[0].id, currentOldRelayID[0].id, tableID);                   //Удаляем старую связь
      tableCorrection(tableID);
      sendRelays(substation, fider, tableID, res);
    }   
  }
});

app.put("/addRelay", jsonParser, async (req, res)=>{
  const changedData = req.body.changedData;
  const substation = req.body.substation;
  const fider = req.body.fider;
  const tableID = req.body.tableID;
  
  const currentNewRelayID = await searchRelayID(changedData, tableID); // Ищем ID нового реле в базе

  const sql_searchSbstFider = "SELECT id FROM substation WHERE substation =? AND fider =?";
  const sql_SbstFiderValues = [substation, fider];
  const sbstFiderID = await new Promise((resolve, reject)=>{                            //Ищем ID фидера и подстанции, где меняем реле
    connection.query(sql_searchSbstFider, sql_SbstFiderValues, (err,result)=>sql_result(resolve,reject,err,result));
  });

  if(currentNewRelayID.length>0){
    addNewTie_substation_current_relay(sbstFiderID[0].id, currentNewRelayID[0].id, tableID);              //Добавляем новую связь
    sendRelays(substation, fider, tableID, res);
  }
  else{
    let sql_addRelay;
    let sql_relay;
    if(tableID==="currentTable"){
      sql_addRelay = "INSERT INTO current_relay (relay_type, ac_dc, relay_current, year, quantity) VALUES (?,?,?,?,?)";
      sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4]];
    }
    if(tableID==="voltageTable"){
      sql_addRelay = "INSERT INTO voltage_relay (relay_type, ac_dc, relay_voltage, year, quantity) VALUES (?,?,?,?,?)";
      sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4]];
    }
    if(tableID === 'measuringTable'){
      sql_addRelay = "INSERT INTO measuring_instruments (device, device_type, measurement_limit, year, quantity, next_verification) VALUES (?,?,?,?,?,?)";
      sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4], changedData[5]];
    }
    if(tableID === 'transTable'){
      sql_addRelay = "INSERT INTO current_transformers (type, coil_05, coil_10p, year, quantity) VALUES (?,?,?,?,?)";
      sql_relay = [changedData[0], changedData[1], changedData[2], changedData[3], changedData[4]];
    }
    const new_current_relayID = await new Promise((resolve, reject)=>{                               //Добавляем новое реле в таблицу токовых реле
      connection.query(sql_addRelay, sql_relay, (err, result)=>sql_result(resolve,reject,err,result));
    });
    addNewTie_substation_current_relay(sbstFiderID[0].id, new_current_relayID.insertId, tableID);
    sendRelays(substation, fider, tableID, res);
  }
})

app.put("/changeObjectSF", jsonParser, async (req, res)=>{
  const newObject = req.body.newObject;
  const oldOject = req.body.oldOject;
  const substation = req.body.substation;

  let sql_insertObject;
  let sql_Object;
  if(substation==='Substation' && oldOject!==''){
    sql_insertObject = "UPDATE substation SET substation = ? WHERE substation = ?";
    sql_Object = "select distinct substation from substation;";

    await new Promise((resolve, reject)=>{                            
      connection.query(sql_insertObject, [newObject, oldOject], (err, result)=>sql_result(resolve,reject,err,result));
    });
  
    sendSQLres(sql_Object, [], res);
  }
  if(substation!=='Substation' && oldOject!==''){
    sql_insertObject = "UPDATE substation SET fider = ? WHERE fider = ? and substation = ?";
    sql_Object = "select distinct fider from substation where substation = ?";

    await new Promise((resolve, reject)=>{                            
      connection.query(sql_insertObject, [newObject, oldOject, substation], (err, result)=>sql_result(resolve,reject,err,result));
    });
  
    sendSQLres(sql_Object, [substation], res);
  }
  if(oldOject===''){
    sql_insertObject = "INSERT INTO substation(substation, fider) VALUES(?,?)";
    sql_Object = "select distinct fider from substation where substation = ?";

    await new Promise((resolve, reject)=>{                             
      connection.query(sql_insertObject, [substation, newObject], (err, result)=>sql_result(resolve,reject,err,result));
    });

    sendSQLres(sql_Object, [substation], res);
  }
});

app.put("/deleteObjectSF", jsonParser, async (req, res)=>{
  const substation = req.body.substation;
  const objectToDel = req.body.obj;

  if(substation==='Substation'){
    const sql_Substation = "SELECT DISTINCT substation FROM substation WHERE substation = ?;";
    let quantity = await new Promise((resolve, reject)=>{                            
      connection.query(sql_Substation, [objectToDel], (err, result)=>sql_result(resolve,reject,err,result));
    });
    res.send(quantity);
  }
  if(substation!=='Substation'){
    const sql_searchFider = "SELECT id FROM substation WHERE substation =? and fider =?";
    const sql_searchInCurrRelay = "SELECT DISTINCT fider_id FROM substation_current_relay WHERE fider_id =?";
    const sql_searchInVoltRelay = "SELECT DISTINCT fider_id FROM substation_voltage_relay WHERE fider_id =?";
    const sql_searchInMeasInstruments = "SELECT DISTINCT fider_id FROM substation_measuring_instruments WHERE fider_id =?";
    const sql_searchInCurrTrans = "SELECT DISTINCT fider_id FROM substation_current_transformers WHERE fider_id =?";
    const sql_delFider = "DELETE FROM substation WHERE id = ?";
    const sql_Object = "select distinct fider from substation where substation = ?";
    const fiderID = await new Promise((resolve, reject)=>{                            //Ищем ID фидера и подстанции, где меняем реле
      connection.query(sql_searchFider, [substation, objectToDel], (err,result)=>sql_result(resolve,reject,err,result));
    });
    const isFider_currRelay = await new Promise((resolve, reject)=>{                            
      connection.query(sql_searchInCurrRelay, [fiderID[0].id], (err,result)=>sql_result(resolve,reject,err,result));
    });
    const isFider_voltRelay = await new Promise((resolve, reject)=>{                            
      connection.query(sql_searchInVoltRelay, [fiderID[0].id], (err,result)=>sql_result(resolve,reject,err,result));
    });
    const isFider_measInstr = await new Promise((resolve, reject)=>{                            
      connection.query(sql_searchInMeasInstruments, [fiderID[0].id], (err,result)=>sql_result(resolve,reject,err,result));
    });
    const isFider_currTrans = await new Promise((resolve, reject)=>{                            
      connection.query(sql_searchInCurrTrans, [fiderID[0].id], (err,result)=>sql_result(resolve,reject,err,result));
    });
    if(isFider_currRelay.length===0 && isFider_voltRelay.length===0 && isFider_measInstr.length===0 && isFider_currTrans.length===0){
      await new Promise((resolve, reject)=>{                           
        connection.query(sql_delFider, [fiderID[0].id], (err, result)=>sql_result(resolve,reject,err,result));
      });

      sendSQLres(sql_Object, [substation], res);
    }
    else{
      res.send('equipment exists');
    }
  }
})

app.delete("/deleteRelay", jsonParser, async (req, res)=>{
  const initData = req.body.initData;
  const substation = req.body.substation;
  const fider = req.body.fider;
  const tableID = req.body.tableID;
  const currentOldRelayID = await searchRelayID(initData, tableID);

  const sql_searchSbstFider = "SELECT id FROM substation WHERE substation =? and fider =?";
  const sql_SbstFiderValues = [substation, fider];
  const sbstFiderID = await new Promise((resolve, reject)=>{                            //Ищем ID фидера и подстанции, где меняем реле
    connection.query(sql_searchSbstFider, sql_SbstFiderValues, (err,result)=>sql_result(resolve,reject,err,result));
  });

  deleteOldTie_substation_current_relay(sbstFiderID[0].id, currentOldRelayID[0].id, tableID);       //Удаляем старую связь
  tableCorrection(tableID);
  sendRelays(substation, fider, tableID, res);
});

app.put('/form', jsonParser, async (req, res) => {
  function splitStringIntoWords(string) {
    const wordsArray = string.match(/\S+/g);
    return wordsArray || [];
  }
  function splitLimit(string) {
    const wordsArray = string.match(/\d+(\.\d+)?-\d+(\.\d+)?\s[A-Za-zА-Яа-я]+/g);
    return wordsArray || [];
  }
  let sql_currRelays = "SELECT substation, fider, current_relay.relay_type, current_relay.ac_dc, current_relay.relay_current," +
  "current_relay.year, current_relay.quantity" +
  " FROM substation" +
  " JOIN substation_current_relay ON substation_current_relay.fider_id = substation.id" +
  " JOIN current_relay ON current_relay_id = current_relay.id" +
  " WHERE";
  let sql_voltRelays = "SELECT substation, fider, voltage_relay.relay_type, voltage_relay.ac_dc, voltage_relay.relay_voltage," +
  "voltage_relay.year, voltage_relay.quantity" + 
  " FROM substation" +
  " JOIN substation_voltage_relay ON fider_id = substation.id" +
  " JOIN voltage_relay ON voltage_relay_id = voltage_relay.id" +
  " WHERE";
  let sql_measInstruments = "SELECT substation, fider, device, device_type, measurement_limit, year, quantity, " +
  "DATE_FORMAT(next_verification, '%d.%m.%Y') AS formatted_next_verification"+
  " FROM substation" +
  " JOIN substation_measuring_instruments ON fider_id = substation.id" +
  " JOIN measuring_instruments ON measuring_instrument_id = measuring_instruments.id" +
  " WHERE";
  let sql_currTranses = "SELECT substation, fider, type, coil_05, coil_10p, year, quantity" + 
  " FROM substation" +
  " JOIN substation_current_transformers ON fider_id = substation.id" +
  " JOIN current_transformers ON current_transformer_id = current_transformers.id" +
  " WHERE";
  let sql_values = [];
  let and = '';
  let fiderEquipment = [];

  const substation = splitStringIntoWords(req.body.substation);
  const fider = splitStringIntoWords(req.body.fider);
  const year = splitStringIntoWords(req.body.year);

  const relayType = splitStringIntoWords(req.body.relayType);
  const relayRange = splitStringIntoWords(req.body.relayRange);

  const voltageRelayType = splitStringIntoWords(req.body.voltageRelayType);
  const voltageType = splitStringIntoWords(req.body.voltageType);

  const device = splitStringIntoWords(req.body.device);
  const deviceType = splitStringIntoWords(req.body.deviceType);
  const limit = splitLimit(req.body.limit);
  const nextVerification = req.body.nextVerification;

  const transType = splitStringIntoWords(req.body.transType);
  const coil_05 = splitStringIntoWords(req.body.coil_05);
  const coil_10p = splitStringIntoWords(req.body.coil_10p);
  
  let commonData = new Map();
  if(substation.length!==0) commonData.set('substation', substation);
  if(fider.length!==0) commonData.set('fider', fider);
  if(year.length!==0) commonData.set('year', year);

  let currentRelayData = new Map();
  if(relayType.length!==0) currentRelayData.set('relay_type', relayType);
  if(relayRange.length!==0) currentRelayData.set('relay_current', relayRange);

  let voltageRelayData = new Map();
  if(voltageRelayType.length!==0){voltageRelayData.set('relay_type', voltageRelayType);}
  if(voltageType.length!==0){voltageRelayData.set('ac_dc', voltageType);}

  let measuringInstrumentsData = new Map();
  if(device.length!==0){measuringInstrumentsData.set('device', device);}
  if(deviceType.length!==0){measuringInstrumentsData.set('device_type', deviceType);}
  if(limit.length!==0){measuringInstrumentsData.set('measurement_limit', limit);}
  if(nextVerification.length===10){
    let str = nextVerification[6]+nextVerification[7]+nextVerification[8]+nextVerification[9]+'-'+
    nextVerification[3]+nextVerification[4]+'-'+nextVerification[0]+nextVerification[1];     
    measuringInstrumentsData.set('next_verification', [str]);
  }
  if(nextVerification.length===7 || nextVerification.length===4){
    measuringInstrumentsData.set('next_verification', [nextVerification]);
  }

  let transData = new Map();
  if(transType.length!==0){transData.set('type', transType);}
  if(coil_05.length!==0){transData.set('coil_05', coil_05);}
  if(coil_10p.length!==0){transData.set('coil_10p', coil_10p);}

  function requestToSQL(string, string2){
    if(commonData.get(string).length===1){
      sql_currRelays += ` ${string2} ${string} = ?`;
      sql_voltRelays += ` ${string2} ${string} = ?`;
      sql_measInstruments += ` ${string2} ${string} = ?`;
      sql_currTranses += ` ${string2} ${string} = ?`;
      sql_values.push(commonData.get(string)[0]);
      and = 'and';
    }
    else{
      sql_currRelays += ` ${string2} (${string} = ?`;
      sql_voltRelays += ` ${string2} (${string} = ?`;
      sql_measInstruments += ` ${string2} (${string} = ?`;
      sql_currTranses += ` ${string2} (${string} = ?`;
      sql_values.push(commonData.get(string)[0]);
      for(let i = 1; i<commonData.get(string).length-1; ++i){
        sql_currRelays += ` or ${string} = ?`;
        sql_voltRelays += ` or ${string} = ?`;
        sql_measInstruments += ` or ${string} = ?`;
        sql_currTranses += ` or ${string} = ?`;
        sql_values.push(commonData.get(string)[i]);
      }
      sql_currRelays += ` or ${string} = ?)`;
      sql_voltRelays += ` or ${string} = ?)`;
      sql_measInstruments += ` or ${string} = ?)`;
      sql_currTranses += ` or ${string} = ?)`;
      sql_values.push(commonData.get(string).at(-1));
      and = 'and';
    }
  }
  function unicRequestToSQL(sql_string, string, string2, map){
    if(map.get(string).length===1){
      sql_string += ` ${string2} ${string} = ?`;
      sql_values.push(map.get(string)[0]);
      and = 'and';
      return sql_string;
    }
    if(map.get(string).length>1){
      sql_string += ` ${string2} (${string} = ?`;
      sql_values.push(map.get(string)[0]);
      for(let i = 1; i<map.get(string).length-1; ++i){
        sql_string += ` or ${string} = ?`;
        sql_values.push(map.get(string)[i]);
      }
      sql_string += ` or ${string} = ?)`;
      sql_values.push(map.get(string).at(-1));
      and = 'and';
      return sql_string;
    }
  }
  function filterRange(string, string2){
    if(currentRelayData.get(string).length===1){
      sql_currRelays += ` ${string2} ABS(${string} - ?) < 0.001`;
      sql_values.push(currentRelayData.get(string)[0]);
      and = 'and';
    }
    if(currentRelayData.get(string).length>1){
      sql_currRelays += ` ${string2} (ABS(${string} - ?) < 0.001`;
      sql_values.push(currentRelayData.get(string)[0]);
      for(let i = 1; i<currentRelayData.get(string).length-1; ++i){
        sql_currRelays += ` or ABS(${string} - ?) < 0.001`;
        sql_values.push(currentRelayData.get(string)[i]);
      }
      sql_currRelays += ` or ABS(${string} - ?) < 0.001)`;
      sql_values.push(currentRelayData.get(string).at(-1));
      and = 'and';
    }
  }
  function sqlReqNextVerification(sql_string, string2){
    if(nextVerification.length===10){
      sql_string += ` ${string2} next_verification = ?`;
      sql_values.push(measuringInstrumentsData.get('next_verification')[0]);
    }
    if(nextVerification.length===4){
      sql_string += ` ${string2} YEAR(next_verification) = ?`
      sql_values.push(measuringInstrumentsData.get('next_verification')[0]);
    }
    if(nextVerification.length===7){
      sql_string += ` ${string2} MONTH(next_verification) = ? and YEAR(next_verification) = ?`
      let month = parseInt(nextVerification[0]+nextVerification[1]);
      let year = parseInt(nextVerification[3]+nextVerification[4]+nextVerification[5]+nextVerification[6]);
      sql_values.push(month);
      sql_values.push(year);
    }
    and = 'and';
    return sql_string;
  }

  if(commonData.size>0 && currentRelayData.size===0 && voltageRelayData.size===0 && measuringInstrumentsData.size===0 && transData.size===0){
    for(let key of commonData.keys()){
      switch(key){
        case 'substation':
          requestToSQL('substation', and);
        break;
        case 'fider':
          requestToSQL('fider', and);
        break;
        case 'year':
          requestToSQL('year', and);
        break;
      } 
    }
  
    const currentRelay = await new Promise((resolve, reject)=>{                             
      connection.query(sql_currRelays, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
    });
    const voltageRelay = await new Promise((resolve, reject)=>{                             
      connection.query(sql_voltRelays, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
    });
    const measureInstruments = await new Promise((resolve, reject)=>{                             
      connection.query(sql_measInstruments, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
    });
    const currentTranses = await new Promise((resolve, reject)=>{                             
      connection.query(sql_currTranses, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
    });
  
    fiderEquipment.push(currentRelay);
    fiderEquipment.push(voltageRelay);
    fiderEquipment.push(measureInstruments);
    fiderEquipment.push(currentTranses);
  
    res.json(fiderEquipment);
  }
  else{
    if(currentRelayData.size!==0){
      for(let key of currentRelayData.keys()){
        switch(key){
          case 'relay_type':
            sql_currRelays = unicRequestToSQL(sql_currRelays, 'relay_type', and, currentRelayData);
          break;
          case 'relay_current':
            filterRange('relay_current', and);
          break;
        }
      }
      for(let key of commonData.keys()){
        switch(key){
          case 'substation':
            sql_currRelays = unicRequestToSQL(sql_currRelays, 'substation', and, commonData);
          break;
          case 'fider':
            sql_currRelays = unicRequestToSQL(sql_currRelays, 'fider', and, commonData);
          break;
          case 'year':
            sql_currRelays = unicRequestToSQL(sql_currRelays, 'year', and, commonData);
          break;
        } 
      }
      and = '';
    
      const currentRelay = await new Promise((resolve, reject)=>{                             
        connection.query(sql_currRelays, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
      });
      sql_values = [];
      fiderEquipment.push(currentRelay);
    }
    else{ fiderEquipment.push([]);}

    if(voltageRelayData.size!==0){
      for(let key of voltageRelayData.keys()){
        switch(key){
          case 'relay_type':
            sql_voltRelays = unicRequestToSQL(sql_voltRelays, 'relay_type', and, voltageRelayData);
          break;
          case 'ac_dc':
            sql_voltRelays = unicRequestToSQL(sql_voltRelays, 'ac_dc', and, voltageRelayData);
          break;
        }
      }
      for(let key of commonData.keys()){
        switch(key){
          case 'substation':
            sql_voltRelays = unicRequestToSQL(sql_voltRelays, 'substation', and, commonData);
          break;
          case 'fider':
            sql_voltRelays = unicRequestToSQL(sql_voltRelays, 'fider', and, commonData);
          break;
          case 'year':
            sql_voltRelays = unicRequestToSQL(sql_voltRelays, 'year', and, commonData);
          break;
        } 
      }
      and = '';

      const voltageRelay = await new Promise((resolve, reject)=>{                             
        connection.query(sql_voltRelays, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
      });
      sql_values = [];
      fiderEquipment.push(voltageRelay);
    }
    else{ fiderEquipment.push([]);}

    if(measuringInstrumentsData.size!==0){
      for(let key of measuringInstrumentsData.keys()){
        switch(key){
          case 'device':
            sql_measInstruments = unicRequestToSQL(sql_measInstruments, 'device', and, measuringInstrumentsData);
          break;
          case 'device_type':
            sql_measInstruments = unicRequestToSQL(sql_measInstruments, 'device_type', and, measuringInstrumentsData);
          break;
          case 'measurement_limit':
            sql_measInstruments = unicRequestToSQL(sql_measInstruments, 'measurement_limit', and, measuringInstrumentsData);
          break;
          case 'next_verification':
            sql_measInstruments = sqlReqNextVerification(sql_measInstruments, and);
          break;
        }
      }
      for(let key of commonData.keys()){
        switch(key){
          case 'substation':
            sql_measInstruments = unicRequestToSQL(sql_measInstruments, 'substation', and, commonData);
          break;
          case 'fider':
            sql_measInstruments = unicRequestToSQL(sql_measInstruments, 'fider', and, commonData);
          break;
          case 'year':
            sql_measInstruments = unicRequestToSQL(sql_measInstruments, 'year', and, commonData);
          break;
        } 
      }
      and = '';
      const measuringInstrument = await new Promise((resolve, reject)=>{                             
        connection.query(sql_measInstruments, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
      });
      sql_values = [];
      fiderEquipment.push(measuringInstrument);
    }
    else{ fiderEquipment.push([]);}

    if(transData.size!==0){
      for(let key of transData.keys()){
        switch (key){
          case 'type':
            sql_currTranses = unicRequestToSQL(sql_currTranses, 'type', and, transData);
          break;
          case 'coil_05':
            sql_currTranses = unicRequestToSQL(sql_currTranses, 'coil_05', and, transData);
          break;
          case 'coil_10p':
            sql_currTranses = unicRequestToSQL(sql_currTranses, 'coil_10p', and, transData);
          break;
        }
      }
      for(let key of commonData.keys()){
        switch(key){
          case 'substation':
            sql_currTranses = unicRequestToSQL(sql_currTranses, 'substation', and, commonData);
          break;
          case 'fider':
            sql_currTranses = unicRequestToSQL(sql_currTranses, 'fider', and, commonData);
          break;
          case 'year':
            sql_currTranses = unicRequestToSQL(sql_currTranses, 'year', and, commonData);
          break;
        } 
      }
      and = '';
      const currTrans = await new Promise((resolve, reject)=>{                             
        connection.query(sql_currTranses, sql_values, (err, result)=>sql_result(resolve,reject,err,result));
      });
      sql_values = [];
      fiderEquipment.push(currTrans);
    }
    else{ fiderEquipment.push([]);}
    res.json(fiderEquipment);
  }
});

app.listen(3000, () => {
  console.log(`Server started at 3000`);
});