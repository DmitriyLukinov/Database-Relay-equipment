let sql_result = (resolve, reject, err, result)=>{
    if (err) {
      console.error("Ошибка выполнения SQL-запроса:", err);
      reject(err);
    } else {
      resolve(result);
    }
}

function splitStringIntoWords(string) {
    const wordsArray = string.match(/\S+/g);
    return wordsArray || [];
}
function splitLimit(string) {
    const wordsArray = string.match(/\d+(\.\d+)?-\d+(\.\d+)?\s[A-Za-zА-Яа-я]+/g);
    return wordsArray || [];
}

async function main1(connection, req, res){   

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
    
    function requestToSQL(commonData, string, string2){
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
              requestToSQL(commonData,'substation', and);
            break;
            case 'fider':
              requestToSQL(commonData, 'fider', and);
            break;
            case 'year':
              requestToSQL(commonData, 'year', and);
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
}

exports.main  = main1;