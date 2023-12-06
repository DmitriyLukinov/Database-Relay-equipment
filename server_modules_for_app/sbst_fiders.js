function sendSQLres(connection, string, arr, res){
    connection.query(string, arr, (err, result)=>{
      if (err) {
        console.error("Ошибка выполнения SQL-запроса:", err);
        return;
      }
      res.json(result);
    })
}

const sql_searchFider = "SELECT id FROM substation WHERE substation =? and fider =?";
const sql_searchInCurrRelay = "SELECT DISTINCT fider_id FROM substation_current_relay WHERE fider_id =?";
const sql_searchInVoltRelay = "SELECT DISTINCT fider_id FROM substation_voltage_relay WHERE fider_id =?";
const sql_searchInMeasInstruments = "SELECT DISTINCT fider_id FROM substation_measuring_instruments WHERE fider_id =?";
const sql_searchInCurrTrans = "SELECT DISTINCT fider_id FROM substation_current_transformers WHERE fider_id =?";
const sql_delFider = "DELETE FROM substation WHERE id = ?";
const sql_Object = "SELECT DISTINCT fider FROM substation WHERE substation = ?";
const sql_Substation = "SELECT DISTINCT substation FROM substation WHERE substation = ?;";

const showSubstations = (connection, res)=>{
    sendSQLres(connection, "SELECT DISTINCT substation FROM substation", [], res);
}

const showFiders = (connection, req, res)=>{
    const fiders = req.body.substation;
    sendSQLres(connection, "SELECT DISTINCT fider FROM substation WHERE substation = ?", fiders, res);
}

const changeObjectSF = async (connection, req, res)=>{
    const newObject = req.body.newObject;
    const oldOject = req.body.oldOject;
    const substation = req.body.substation;

    let sql_insertObject;
    let sql_Object;
    if(substation==='Substation' && oldOject!==''){
        sql_insertObject = "UPDATE substation SET substation = ? WHERE substation = ?";
        sql_Object = "SELECT DISTINCT substation FROM substation;";

        await new Promise((resolve)=>{                            
            connection.query(sql_insertObject, [newObject, oldOject], (err, result)=>{
                resolve(result);
            });
        });
    
        sendSQLres(connection, sql_Object, [], res);
    }
    if(substation!=='Substation' && oldOject!==''){
        sql_insertObject = "UPDATE substation SET fider = ? WHERE fider = ? and substation = ?";
        sql_Object = "SELECT DISTINCT fider FROM substation WHERE substation = ?";

        await new Promise((resolve)=>{                            
        connection.query(sql_insertObject, [newObject, oldOject, substation], (err, result)=>{resolve(result)});
        });
    
        sendSQLres(connection, sql_Object, [substation], res);
    }
    if(oldOject===''){
        sql_insertObject = "INSERT INTO substation(substation, fider) VALUES(?,?)";
        sql_Object = "SELECT DISTINCT fider FROM substation WHERE substation = ?";

        await new Promise((resolve)=>{                             
            connection.query(sql_insertObject, [substation, newObject], (err, result)=>{
                resolve(result);
            });
        });

        sendSQLres(connection, sql_Object, [substation], res);
    }
}

const deleteObjectSF = async (connection, req, res)=>{
    const substation = req.body.substation;
    const objectToDel = req.body.obj;

    if(substation==='Substation'){
        let quantity = await new Promise((resolve)=>{                            
        connection.query(sql_Substation, [objectToDel], (err, result)=>{resolve(result)});
        });
        res.send(quantity);
    }
    if(substation!=='Substation'){
        const fiderID = await new Promise((resolve)=>{                            //Ищем ID фидера и подстанции, где меняем реле
        connection.query(sql_searchFider, [substation, objectToDel], (err,result)=>{resolve(result)});
        });

        const isFider_currRelay = await new Promise((resolve)=>{                            
        connection.query(sql_searchInCurrRelay, [fiderID[0].id], (err,result)=>{resolve(result)});
        });
        const isFider_voltRelay = await new Promise((resolve)=>{                            
        connection.query(sql_searchInVoltRelay, [fiderID[0].id], (err,result)=>{resolve(result)});
        });
        const isFider_measInstr = await new Promise((resolve)=>{                            
        connection.query(sql_searchInMeasInstruments, [fiderID[0].id], (err,result)=>{resolve(result)});
        });
        const isFider_currTrans = await new Promise((resolve)=>{                            
        connection.query(sql_searchInCurrTrans, [fiderID[0].id], (err,result)=>{resolve(result)});
        });

        if(isFider_currRelay.length===0 && isFider_voltRelay.length===0 && isFider_measInstr.length===0 && isFider_currTrans.length===0){
            await new Promise((resolve)=>{                           
                connection.query(sql_delFider, [fiderID[0].id], (err, result)=>{resolve(result)});
            });
            sendSQLres(connection, sql_Object, [substation], res);
        }
        else{
            res.send('equipment exists');
        }
    }
}

exports.showSubstations = showSubstations;
exports.showFiders = showFiders;
exports.changeObjectSF = changeObjectSF;
exports.deleteObjectSF = deleteObjectSF;