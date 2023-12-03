import React, { useState, useRef } from 'react';
import VoltageRelay from './voltage_relays';
import MeasuringInstruments from './measuring_instruments';
import CurrentTransformers from './current_transformers';
import DropDownRelays from './drop_down_lists/drop_down_relays';
import DropDownCurrent from './drop_down_lists/drop_down_current';
import DropDownRange from './drop_down_lists/drop_down_range';
import { getDropDownRelays, getDropDownRange, deleteRelay } from './fetches';
import AddDataDialog from './add_data_dialog';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import '../src/style/relay equipment tables.css';

const Relays = ({
  relay, initRelayRef, setCell, cell, enableCollectInitData, name, fider, setRelay, addSwitch, enableAddNewRef, 
  voltageRelay, setVoltageRelay, measuringInstrument, setMeasuringInstrument, currentTrans, setCurrentTrans, column})=>{

  const [dropDownRelaysList, setDropDownRelaysList] = useState([]);
  const [dropDownRangeList, setDropDownRangeList] = useState([]);
  const [dropDownDeviceTypeList, setDropDownDeviceTypeList] = useState([]);
  const newInputRelayRef = useRef(); //для модального окна "добавить элемент"
  const newInputRangeRef = useRef(); //для модального окна "добавить элемент"
  const newInputDeviceTypeRef = useRef(); //для модального окна "добавить элемент"
   
  function collectInitData(row, initRelayRef, tableID){
    let t = document.getElementById(tableID);
    if(tableID==="currentTable" || tableID==="voltageTable" || tableID==="transTable"){
      for(let i=2; i<7; ++i){
        let item = t.rows[row + 1].cells[i].innerText;
        initRelayRef.current.push(item);
      }
    }
    if(tableID==="measuringTable"){
      for(let i=2; i<8; ++i){
        let item = t.rows[row + 1].cells[i].innerText;
        initRelayRef.current.push(item);
      }
    }
  }

  const dropDownTable = async (e) => {
    let targetCell = e.currentTarget;
    column.current = targetCell.cellIndex;
    let tableID = targetCell.closest('[id]').id;
    let row = targetCell.parentElement.sectionRowIndex; 

    let updatedCells = [...cell];

    if(updatedCells.length===0 || (updatedCells.at(-1)[0]===row && updatedCells.at(-1)[2]===tableID)){
      if(enableCollectInitData.current===true){
        collectInitData(row, initRelayRef, tableID);
        enableCollectInitData.current=false;
      } 
      updatedCells.push([row, column.current, tableID]);
      setCell(updatedCells); 
      if(column.current===2){
        const dropDownData = await getDropDownRelays(tableID, 2);
        setDropDownRelaysList(dropDownData);
        newInputRelayRef.current=undefined;       
      }
      if(column.current===3 && tableID==="measuringTable"){
        const dropDownData = await getDropDownRelays(tableID, 3);
        setDropDownDeviceTypeList(dropDownData);
        newInputDeviceTypeRef.current=undefined;
      }
      if(column.current===3 && tableID==="transTable"){
        const dropDownData = await getDropDownRange(tableID);
        setDropDownDeviceTypeList(dropDownData);
        newInputDeviceTypeRef.current=undefined;
      }
      if(column.current===4){
        const dropDownData = await getDropDownRange(tableID);
        setDropDownRangeList(dropDownData);
        newInputRangeRef.current=undefined;
      }
    }  
  }

  function compare(cell, r, c, tableID){
    if(enableAddNewRef.current===true){ // Чтобы нельзя было изменять таблицу после фильтрации
      for(let i = 0; i<cell.length; i++){
        if(cell[i][0]===r && cell[i][1]===c && cell[i][2]===tableID) 
        return true;
      }
    }
  }

  async function deleteRow(e, name, fider){
    if(enableAddNewRef.current===true){ // Чтобы нельзя было изменять таблицу после фильтрации
      let targetCell = e.target;
      let tableID = targetCell.closest('[id]').id;
      let row = targetCell.parentElement.parentElement.sectionRowIndex;

      if(cell.length===0 || (cell.at(-1)[0]===row && cell.at(-1)[2]===tableID)){
        if(enableCollectInitData.current===true){
          collectInitData(row, initRelayRef, tableID);
          enableCollectInitData.current=false;
        } 
        let checkArr = [1];
        for(let i of initRelayRef.current){
          if(i==='')
          checkArr.push(1);
        }
        console.log(checkArr);
        let delRow;
        if(checkArr.length===6){
          switch(tableID){
            case "currentTable":
              delRow = [...relay];
              delRow.pop();
              setRelay(delRow);
            break;
            case "voltageTable":
              delRow = [...voltageRelay];
              delRow.pop();
              setVoltageRelay(delRow);
            break;
            case "transTable":
              delRow = [...currentTrans];
              delRow.pop();
              setCurrentTrans(delRow);
            break;
          }
        }
        if(checkArr.length===7){ //для СИТ таблицы
          delRow = [...measuringInstrument];
          delRow.pop();
          setMeasuringInstrument(delRow);
        }       
        if(checkArr.length===1){
          let lastData = await deleteRelay(initRelayRef, name, fider, tableID);
          if(tableID==="currentTable") {setRelay(lastData);}
          if(tableID==="voltageTable") {setVoltageRelay(lastData);}
          if(tableID==="measuringTable") {setMeasuringInstrument(lastData);}
          if(tableID==="transTable") {setCurrentTrans(lastData);}
        }
        setCell([]);
        column.current='';
        initRelayRef.current=[];
        enableCollectInitData.current=true;
        addSwitch.current='';
      }
    }
  }

  const addNew = (e, name, fider)=>{
    let btn = e.currentTarget.id;
    let updatedCells = [...cell];
    let newRow;

    function addingPrepare(table, arr, funct){
      newRow = [...arr];
      newRow.push([name, fider]);
      updatedCells.push([newRow.length-1, 0, table]);
      setCell(updatedCells); 
      funct(newRow);
      addSwitch.current='addRelay';
    }

    if(enableAddNewRef.current===true){
      if(btn === "add_currentTable" && cell.length===0){
        addingPrepare("currentTable", relay, setRelay);
      }
      if(btn === "add_voltageTable" && cell.length===0){
        addingPrepare("voltageTable", voltageRelay, setVoltageRelay);
      }
      if(btn==="add_measuringTable" && cell.length===0){
        addingPrepare("measuringTable", measuringInstrument, setMeasuringInstrument);
      }
      if(btn==="add_transTable" && cell.length===0){
        addingPrepare("transTable", currentTrans, setCurrentTrans);
      }
    }
  }

  function sortRelay(e){
    function setSortedData(int, tableID){
      let sortedRelay;
      switch(tableID){
        case 'currentTable':
          sortedRelay = [...relay];
          sortedRelay.sort(function(a,b){return a[int]-b[int]});
          setRelay(sortedRelay);
        break;
        case 'voltageTable':
          sortedRelay = [...voltageRelay];
          sortedRelay.sort(function(a,b){return a[int]-b[int]});
          setVoltageRelay(sortedRelay);
        break;
        case 'measuringTable':
          sortedRelay  = [...measuringInstrument];
          sortedRelay.sort(function(a,b){return a[int]-b[int]});
          setMeasuringInstrument(sortedRelay);
        break;
        case 'transTable':
          sortedRelay  = [...currentTrans];
          sortedRelay.sort(function(a,b){return a[int]-b[int]});
          setCurrentTrans(sortedRelay);
        break;
      }
      
    }
    let targetCell = e.currentTarget;
    switch(targetCell.previousSibling.data){
      case 'Year':
        setSortedData(5, targetCell.closest('table').id);
      break;
      case 'Relay Current':
        setSortedData(4, targetCell.closest('table').id);
      break;
    }
  }

  return (
    <>
      <Row id ='currentLabel'>
        <Button className="addNew" variant="primary" size="sm" id="add_currentTable" onClick={(e)=>addNew(e, name, fider)}>Add new</Button>
        <h5>Current Ralays</h5>
      </Row>
      <Table striped bordered hover size="sm" id="currentTable" className='equipmentTable'>
        <thead>
          <tr>
            <th>Substation</th>
            <th>Fider</th>
            <th>Relay Type</th>
            <th>AC/DC</th>
            <th>
              Relay Current
              <svg onClick={(e)=>sortRelay(e)} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16">
                <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
              </svg>
            </th>
            <th>
              Year
              <svg onClick={(e)=>sortRelay(e)} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16">
                <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
              </svg>
            </th>
            <th>Quantity</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {relay.map((item, index)=>(
            <tr key={index}>
              <td>{item[0]}</td>
              <td>{item[1]}</td>
              <td onClick={(e)=>dropDownTable(e)}>
                {compare(cell,index,2,"currentTable") ? <DropDownRelays dropDownRelaysList={dropDownRelaysList} newInputRelayRef={newInputRelayRef}/> : item[2]}
              </td>
              <td onClick={(e)=>dropDownTable(e)}>
                {compare(cell, index, 3,"currentTable") ? <DropDownCurrent /> : item[3]}
              </td>
              <td onClick={(e)=>dropDownTable(e)}>
                {compare(cell,index,4,"currentTable") ? <DropDownRange dropDownRangeList={dropDownRangeList} newInputRangeRef={newInputRangeRef}/> : item[4]}
              </td>
              <td onClick={(e)=>dropDownTable(e)}>
                {compare(cell,index,5,"currentTable") ? <Form.Control size="sm" type="text" autofocus="autofocus"/> : item[5]}
              </td>
              <td onClick={(e)=>dropDownTable(e)}>
                {compare(cell,index,6,"currentTable") ? <Form.Control size="sm" type="text" autofocus="autofocus"/> : item[6]}
              </td>
              <td><Button variant="danger" size="sm" onClick={(e)=>deleteRow(e,name,fider)}>Delete</Button></td>
            </tr>
          ))}
        </tbody>
      </Table>

      <VoltageRelay 
        relay={voltageRelay} 
        dropDownTable={dropDownTable} 
        compare={compare}
        cell = {cell}
        dropDownRelaysList = {dropDownRelaysList}
        newInputRelayRef={newInputRelayRef}
        deleteRow={deleteRow}
        name={name}
        fider={fider}
        addNew={addNew}
        sortRelay={sortRelay}
      />

      <MeasuringInstruments 
        relay={measuringInstrument}
        dropDownTable={dropDownTable}
        compare={compare}
        cell = {cell}
        dropDownRelaysList = {dropDownRelaysList}
        dropDownDeviceTypeList = {dropDownDeviceTypeList}
        dropDownRangeList={dropDownRangeList}
        newInputRelayRef={newInputRelayRef}
        newInputDeviceTypeRef={newInputDeviceTypeRef}
        newInputRangeRef={newInputRangeRef}
        deleteRow={deleteRow}
        name={name}
        fider={fider}
        addNew={addNew}
        sortRelay={sortRelay}
      />

      <CurrentTransformers
        relay={currentTrans}
        dropDownTable={dropDownTable}
        compare={compare}
        cell = {cell}
        dropDownRelaysList = {dropDownRelaysList}
        dropDownRangeList={dropDownRangeList}
        dropDownDeviceTypeList = {dropDownDeviceTypeList}
        newInputRelayRef={newInputRelayRef}
        newInputRangeRef={newInputRangeRef}
        newInputDeviceTypeRef={newInputDeviceTypeRef}
        deleteRow={deleteRow}
        name={name}
        fider={fider}
        addNew={addNew}
        sortRelay={sortRelay}
      />

      <AddDataDialog column={column} setDropDownRelaysList={setDropDownRelaysList} setDropDownRangeList={setDropDownRangeList}
      setDropDownDeviceTypeList={setDropDownDeviceTypeList} 
      newInputRelayRef={newInputRelayRef} newInputRangeRef={newInputRangeRef} newInputDeviceTypeRef={newInputDeviceTypeRef}/>
    </>
  )
};

export default Relays;