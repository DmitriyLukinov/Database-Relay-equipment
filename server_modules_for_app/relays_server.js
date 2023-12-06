const sql_currentRelays = `SELECT substation, fider, relay_type, ac_dc, relay_current, year, quantity
FROM substation
JOIN substation_current_relay ON substation_current_relay.fider_id = substation.id
JOIN current_relay ON current_relay_id = current_relay.id
WHERE substation = ? AND fider = ? ORDER BY relay_type`;
const sql_voltageRelays = `SELECT substation, fider, relay_type, ac_dc, relay_voltage, year, quantity
FROM substation
JOIN substation_voltage_relay ON fider_id = substation.id
JOIN voltage_relay ON voltage_relay_id = voltage_relay.id
WHERE substation = ? AND fider = ? ORDER BY relay_type`;
const sql_measureInstruments = `SELECT substation, fider, device, device_type, measurement_limit, year, quantity,
DATE_FORMAT(next_verification, '%d.%m.%Y') AS formatted_next_verification
FROM substation
JOIN substation_measuring_instruments ON fider_id = substation.id
JOIN measuring_instruments ON measuring_instrument_id = measuring_instruments.id
WHERE substation = ? AND fider = ?`;
const sql_currentTranses = `SELECT substation, fider, type, coil_05, coil_10p, year, quantity 
FROM substation
JOIN substation_current_transformers ON fider_id = substation.id
JOIN current_transformers ON current_transformer_id = current_transformers.id
WHERE substation = ? AND fider = ?`;

function sendSQLres(connection, string, arr, res){
    connection.query(string, arr, (err, result)=>{
      if (err) {
        console.error("Ошибка выполнения SQL-запроса:", err);
        return;
      }
      res.json(result);
    })
}
async function searchRelayID(connection, data, tableID){  
    let sql_searchRelay;
    if(tableID === 'currentTable') {
        sql_searchRelay = "SELECT id FROM current_relay WHERE relay_type = ? AND ac_dc = ? AND ABS(relay_current - ?) < 0.001 AND year = ? AND quantity = ?";
    }
    if(tableID === 'voltageTable') {
        sql_searchRelay = "SELECT id FROM voltage_relay WHERE relay_type = ? AND ac_dc = ? AND ABS(relay_voltage - ?) < 0.001 AND year = ? AND quantity = ?";
    }
    if(tableID === 'measuringTable') {
        sql_searchRelay = "SELECT id FROM measuring_instruments WHERE device = ? AND device_type = ? AND measurement_limit = ? AND year = ? AND quantity = ? AND next_verification = ?";
    }
    if(tableID === 'transTable') {
        sql_searchRelay = "SELECT id FROM current_transformers WHERE type = ? AND coil_05 = ? AND coil_10p = ? AND year = ? AND quantity = ?";
    }
  
    if(data[5]!==undefined){
      let sql_date = data[5][6]+data[5][7]+data[5][8]+data[5][9]+'-'+data[5][3]+data[5][4]+'-'+data[5][0]+data[5][1];
      data[5]=sql_date;
    }
    const sql_RelayValues = [data[0],data[1],data[2],data[3],data[4],data[5]];
    const currentRelayID = await new Promise((resolve) => {                    // Ищем ID нового реле в базе
      connection.query(sql_searchRelay, sql_RelayValues, (err, result)=>{resolve(result)});
    });
    return currentRelayID;
}
async function addNewTie(connection, sbstFiderID, relayID, tableID){
    const sql_fiderNewRelay = [sbstFiderID, relayID];
    
    let sql_insertChangedRelay;
    if(tableID === 'currentTable') {
        sql_insertChangedRelay = "INSERT INTO substation_current_relay(fider_id, current_relay_id) VALUES(?,?)";
    }
    if(tableID === 'voltageTable') {
        sql_insertChangedRelay = "INSERT INTO substation_voltage_relay(fider_id, voltage_relay_id) VALUES(?,?)";
    }
    if(tableID === 'measuringTable') {
        sql_insertChangedRelay = "INSERT INTO substation_measuring_instruments(fider_id, measuring_instrument_id) VALUES(?,?)";
    }
    if(tableID === 'transTable') {
        sql_insertChangedRelay = "INSERT INTO substation_current_transformers(fider_id, current_transformer_id) VALUES(?,?)";
    }

    await new Promise((resolve)=>{                             //Добавляем новую связь
        connection.query(sql_insertChangedRelay, sql_fiderNewRelay, (err, result)=>{resolve(result)});
    });
}
async function deleteOldTie(connection, sbstFiderID, relayID, tableID){
    const sql_fiderOldRelay = [sbstFiderID, relayID];
    let sql_deleteItitRelay;
    if(tableID === 'currentTable') {
        sql_deleteItitRelay = "DELETE FROM substation_current_relay WHERE fider_id = ? AND current_relay_id =?";
    }
    if(tableID === 'voltageTable') {
        sql_deleteItitRelay = "DELETE FROM substation_voltage_relay WHERE fider_id = ? AND voltage_relay_id =?";
    }
    if(tableID === 'measuringTable') {
        sql_deleteItitRelay = "DELETE FROM substation_measuring_instruments WHERE fider_id = ? AND measuring_instrument_id =?";
    }
    if(tableID === 'transTable') {
        sql_deleteItitRelay = "DELETE FROM substation_current_transformers WHERE fider_id = ? AND current_transformer_id =?";
    }
    await new Promise((resolve)=>{                             //Удаляем старую связь
      connection.query(sql_deleteItitRelay, sql_fiderOldRelay, (err, result)=>{resolve(result)});
    });
}
async function tableCorrection(connection, tableID){
    const checkReminder = await new Promise((resolve)=>{            //Проверяем, сколько ещё таких реле такого кол-ва осталось
      connection.query('SELECT*FROM trigger_result', (err, result)=>{resolve(result)});
    });

    let sql_dropRelay;
    
    if(checkReminder[0].item===0){                                          //Если таких реле больше нет, удаляем из таблицы токовых реле
      if(tableID === 'currentTable') {sql_dropRelay = "DELETE FROM current_relay WHERE id=?";}
      if(tableID === 'voltageTable') {sql_dropRelay = "DELETE FROM voltage_relay WHERE id=?";}
      if(tableID === 'measuringTable') {sql_dropRelay = "DELETE FROM measuring_instruments WHERE id=?";}
      if(tableID === 'transTable') {sql_dropRelay = "DELETE FROM current_transformers WHERE id=?";}
      await new Promise((resolve)=>{
        connection.query(sql_dropRelay, checkReminder[0].id, (err, result)=>{resolve(result)});
      });
    }
}
function sendRelays(connection, substation, fider, tableID, res){
    let sql_searchRelays;
    if(tableID === 'currentTable') {sql_searchRelays = sql_currentRelays;}
    if(tableID === 'voltageTable') {sql_searchRelays = sql_voltageRelays;}
    if(tableID === 'measuringTable') {sql_searchRelays = sql_measureInstruments;}
    if(tableID === 'transTable') {sql_searchRelays = sql_currentTranses;}
    const sql_values = [substation, fider];

    sendSQLres(connection, sql_searchRelays, sql_values, res);
}



function showRelays(connection, req, res){
    const fider = req.body.fider;
    const substation = req.body.substation;

    const sql_values = [substation, fider];

    Promise.all([
        new Promise((resolve)=>{                             
        connection.query(sql_currentRelays, sql_values, (err, result)=>{resolve(result)});
        }),
        new Promise((resolve)=>{                             
        connection.query(sql_voltageRelays, sql_values, (err, result)=>{resolve(result)});
        }),
        new Promise((resolve)=>{                             
        connection.query(sql_measureInstruments, sql_values, (err, result)=>{resolve(result)});
        }),
        new Promise((resolve)=>{                             
        connection.query(sql_currentTranses, sql_values, (err, result)=>{resolve(result)});
        }) 
    ]).then((value)=>{res.json(value)});
}

function showDropDownRelays(connection, req, res){
    const tableID = req.body.table;
    const colunmID = req.body.column;

    if(tableID==='currentTable') {sendSQLres(connection, "SELECT DISTINCT relay_type FROM current_relay", [], res);}
    if(tableID==='voltageTable') {sendSQLres(connection, "SELECT DISTINCT relay_type FROM voltage_relay", [], res);}
    if(tableID==='measuringTable' && colunmID===2) {sendSQLres(connection, "SELECT DISTINCT device FROM measuring_instruments", [], res);}
    if(tableID==='measuringTable' && colunmID===3) {sendSQLres(connection, "SELECT DISTINCT device_type FROM measuring_instruments", [], res);}
    if(tableID==='transTable') {sendSQLres(connection, "SELECT DISTINCT type FROM current_transformers", [], res);}
}

function showDropDownRange(connection, req, res){
    const tableID = req.body.table;

    if(tableID==='currentTable') {sendSQLres(connection, "SELECT DISTINCT relay_current FROM current_relay ORDER BY relay_current desc", [], res);}
    if(tableID==='measuringTable') {sendSQLres(connection, "SELECT DISTINCT measurement_limit FROM measuring_instruments ORDER BY measurement_limit desc", [], res);}
    if(tableID==='transTable') {sendSQLres(connection, "SELECT coil_05 AS coils FROM current_transformers UNION SELECT coil_10p AS coils FROM current_transformers ORDER BY coils", [], res);}
}



async function addRelay(connection, req, res){
    const changedData = req.body.changedData;
    const substation = req.body.substation;
    const fider = req.body.fider;
    const tableID = req.body.tableID;
    
    const currentNewRelayID = await searchRelayID(connection, changedData, tableID); // Ищем ID нового реле в базе

    const sql_SbstFiderValues = [substation, fider];
    const sbstFiderID = await new Promise((resolve)=>{                            //Ищем ID фидера и подстанции, где меняем реле
        connection.query("SELECT id FROM substation WHERE substation =? AND fider =?", sql_SbstFiderValues, (err,result)=>{resolve(result)});
    });

    if(currentNewRelayID.length>0){
        addNewTie(connection, sbstFiderID[0].id, currentNewRelayID[0].id, tableID);              //Добавляем новую связь
        sendRelays(connection, substation, fider, tableID, res);
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
        const new_current_relayID = await new Promise((resolve)=>{                               //Добавляем новое реле в таблицу токовых реле
            connection.query(sql_addRelay, sql_relay, (err, result)=>{resolve(result)});
        });
        addNewTie(connection, sbstFiderID[0].id, new_current_relayID.insertId, tableID);
        sendRelays(connection, substation, fider, tableID, res);
    }
}
async function deleteRelay(connection, req, res){
    const initData = req.body.initData;
    const substation = req.body.substation;
    const fider = req.body.fider;
    const tableID = req.body.tableID;
    const currentOldRelayID = await searchRelayID(connection, initData, tableID);

    const sql_searchSbstFider = "SELECT id FROM substation WHERE substation =? and fider =?";
    const sql_SbstFiderValues = [substation, fider];
    const sbstFiderID = await new Promise((resolve)=>{                            //Ищем ID фидера и подстанции, где меняем реле
        connection.query(sql_searchSbstFider, sql_SbstFiderValues, (err,result)=>{resolve(result)});
    });

    deleteOldTie(connection, sbstFiderID[0].id, currentOldRelayID[0].id, tableID);       //Удаляем старую связь
    tableCorrection(connection, tableID);
    sendRelays(connection, substation, fider, tableID, res);
}
async function changeRelay(connection, req, res){
    const initData = req.body.initData;
    const changedData = req.body.changedData;
    const tableID = req.body.tableID;
    const substation = req.body.substation;
    const fider = req.body.fider;

    if (initData[0] !== changedData[0] || initData[1] !== changedData[1] || initData[2] !== changedData[2] || initData[3] !== changedData[3] || initData[4] !== changedData[4] || initData[5] !== changedData[5]){
    
        const currentNewRelayID = await searchRelayID(connection, changedData, tableID); // Ищем ID нового реле в базе
        const currentOldRelayID = await searchRelayID(connection, initData, tableID);    //Ищем  ID старого реле в базе

        const sql_searchSbstFider = "SELECT id FROM substation WHERE substation =? and fider =?";
        const sql_SbstFiderValues = [substation, fider];
        const sbstFiderID = await new Promise((resolve)=>{                            //Ищем ID фидера и подстанции, где меняем реле
        connection.query(sql_searchSbstFider, sql_SbstFiderValues, (err,result)=>{resolve(result)});
        });

        console.log(`currentOldRelayID = ${currentOldRelayID}`);
        console.log(`currentOldRelayID = ${currentOldRelayID[0].id}`);

        if(currentNewRelayID.length>0){                   //Если новое реле уже есть 
        addNewTie(connection, sbstFiderID[0].id, currentNewRelayID[0].id, tableID);                      //Добавляем новую связь
        deleteOldTie(connection, sbstFiderID[0].id, currentOldRelayID[0].id, tableID);                           //Удаляем старую связь
        tableCorrection(connection, tableID);
        sendRelays(connection, substation, fider, tableID, res);
        } 
        else{                                             //если нет такого реле 
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
        const new_current_relayID = await new Promise((resolve)=>{                               //Добавляем новое реле в таблицу токовых реле
            connection.query(sql_addRelay, sql_relay, (err, result)=>{resolve(result)});
        });

        addNewTie(connection, sbstFiderID[0].id, new_current_relayID.insertId, tableID);                 //Добавляем новую связь
        deleteOldTie(connection, sbstFiderID[0].id, currentOldRelayID[0].id, tableID);                   //Удаляем старую связь
        tableCorrection(connection, tableID);
        sendRelays(connection, substation, fider, tableID, res);
        }   
    }
}

exports.showRelays = showRelays;

exports.showDropDownRelays = showDropDownRelays;
exports.showDropDownRange = showDropDownRange;

exports.addRelay = addRelay;
exports.deleteRelay = deleteRelay;
exports.changeRelay = changeRelay;