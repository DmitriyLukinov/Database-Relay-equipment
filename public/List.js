import React, { useEffect, useRef, useState } from 'react';
import { getSubstations, changeRelay, addRelay, changeObjectSF, deleteObjectSF } from './fetches';
import Relays from './relays';
import Filter from './filter/filter_modal';
import Table from 'react-bootstrap/Table';
import Navbar from 'react-bootstrap/Navbar';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import { Formik, Field, Form } from 'formik';
import '../src/style/common styles.css';
import '../src/style/styleSF.css';

const List = ({table, substation_fider, setSubstation_fider, backWard, relay, name, currentFunction, fider,
  setRelay, cell, setCell, setTable, enableAddNewRef, voltageRelay, setVoltageRelay, measuringInstrument, setMeasuringInstrument, currentTrans,
  setCurrentTrans, enableCollectInitData, initRelayRef, addSwitch, column, rowSF, setRowSF, initObjectRef, addSwitchSF}) => {

  useEffect(() => {
    async function fetchData() {
      const initialData = await getSubstations();
      setSubstation_fider(initialData);
    }   
    fetchData();
  }, []);

  const changedRelayRef = useRef([]);
  const [show, setShow] = useState(false); // для фильтра модального окна
  
  const change = async (changedRelayRef, initRelayRef, name, fider) => {
    if(cell.at(-1)[1]!==0){ //Кнопка "Apply changes" не выдаст ошибку, если нажата случайно и ничего не введено
      changedRelayRef.current = [];
      let t = document.getElementById(cell.at(-1)[2]);
      if(                                                         //Проверяем корректность данных для нового реле
        t.rows[cell.at(-1)[0] + 1].cells[2].firstChild===null || t.rows[cell.at(-1)[0] + 1].cells[3].firstChild===null ||       
        t.rows[cell.at(-1)[0] + 1].cells[4].firstChild===null || t.rows[cell.at(-1)[0] + 1].cells[5].firstChild===null ||     
        t.rows[cell.at(-1)[0] + 1].cells[6].firstChild===null || t.rows[cell.at(-1)[0] + 1].cells[7].firstChild===null){
        alert('Incompete data');
        changedRelayRef.current=[];
        return;
      };
      function checkFormat(regexp, int, string){
        if(regexp.test(t.rows[cell.at(-1)[0] + 1].cells[int].firstChild.value)===false &&
          regexp.test(t.rows[cell.at(-1)[0] + 1].cells[int].firstChild.textContent)===false){
          throw new Error(string);
        }
      }
      if(t.id==="currentTable" || t.id==="voltageTable"){
        try {checkFormat(/^[^\s].{0,19}$/, 2, "Invalid data in the 'Relay Type' column\nRelay length should be less than 30 characters");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^(?!0\d+\.\d*$|0\d*$)\d+(\.\d+)?$/, 4, "Invalid data in the 'Relay Current' column \n Use dot if enter float number");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^(19[0-9][0-9]|20[0-9][0-9]|21[0-4][0-9]|215[0-5])$/, 5, 'Year sould be more than 1901 and less than 2155');}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^[1-9]\d{0,10}$/, 6, "Invalid data in the 'Quantity' column \nNumber should consist of 9 cyphers or less");}
        catch (error){alert(error.message); return;}
      }
      if(t.id==="measuringTable"){
        try {checkFormat(/^[^\s].{0,29}$/, 2, "Invalid data in the 'Device' column\nDevice length should be less than 30 characters");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^[^\s].{0,19}$/, 3, "Invalid data in the 'Device type' column\nDevice type length should be less than 20 characters");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^\d+(\.\d+)?-\d+(\.\d+)? [A-Za-zА-Яа-я]+$/, 4, 'Use a following format:\n\n xxx-yyy units\n\n where xxx - start of measuring range\n yyy- end of measuring range\n');}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^(19[0-9][0-9]|20[0-9][0-9]|21[0-4][0-9]|215[0-5])$/, 5, 'Year sould be more than 1901 and less than 2155');}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^[1-9]\d{0,10}$/, 6, "Invalid data in the 'Quantity' column \nNumber should consist of 9 cyphers or less");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(?!0{1,3}\d)\d{4}$/, 7, 
        "Invalid data in the 'Next verification' column\nUse following format: day.month.year");}
        catch (error){alert(error.message); return;}
      }
      if(t.id==="transTable"){
        try {checkFormat(/^[^\s].{0,19}$/, 2, "Invalid data in the 'Type' column\nDevice length should be less than 30 characters");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^[1-9]\d{0,5}\/[1-9]\d{0,5}$/, 3, "Invalid data in the 'Coil 0.5' column");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^[1-9]\d{0,5}\/[1-9]\d{0,5}$/, 4, "Invalid data in the 'Coil 10P' column");}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^(19[0-9][0-9]|20[0-9][0-9]|21[0-4][0-9]|215[0-5])$/, 5, 'Year sould be more than 1901 and less than 2155');}
        catch (error){alert(error.message); return;}
        try {checkFormat(/^[1-9]\d{0,10}$/, 6, "Invalid data in the 'Quantity' column \nNumber should consist of 9 cyphers or less");}
        catch (error){alert(error.message); return;}
      }
  
      let r = t.rows;
      for (let i = 1; i<r.length; ++i){ //Проверка на дубликатные записи
        if(i===cell.at(-1)[0]+1) continue;
        else if(
          t.rows[i].cells[2].innerText===changedRelayRef.current[0] &&
          t.rows[i].cells[3].innerText===changedRelayRef.current[1] &&
          t.rows[i].cells[4].innerText===changedRelayRef.current[2] &&
          t.rows[i].cells[5].innerText===changedRelayRef.current[3] &&
          t.rows[i].cells[6].innerText===changedRelayRef.current[4] && (t.id==="currentTable" || t.id==="voltageTable" || t.id==="transTable"))
          {
          alert('DUPLICATE');
          return;
        }
        else if(
          t.rows[i].cells[2].innerText===changedRelayRef.current[0] &&
          t.rows[i].cells[3].innerText===changedRelayRef.current[1] &&
          t.rows[i].cells[4].innerText===changedRelayRef.current[2] &&
          t.rows[i].cells[5].innerText===changedRelayRef.current[3] &&
          t.rows[i].cells[6].innerText===changedRelayRef.current[4] &&
          t.rows[i].cells[7].innerText===changedRelayRef.current[5] && (t.id==="measuringTable")
        ){
          alert('DUPLICATE');
          return;
        }
      }

      function changedItem(int){
        for(let i=2; i<int; ++i){ 
          let data = t.rows[cell.at(-1)[0] + 1].cells[i].firstChild.value;
          if (data!==undefined) {
            changedRelayRef.current.push(data);
          }
          else {
            data = t.rows[cell.at(-1)[0] + 1].cells[i].innerText;
            changedRelayRef.current.push(data);
          }
        }
      }
      if(t.id==="currentTable" || t.id==="voltageTable" || t.id==="transTable") {changedItem(7);}
      if(t.id==="measuringTable") {changedItem(8);}

      if(addSwitch.current==='addRelay'){ //Добавляем реле
        let lastData = await addRelay(changedRelayRef, cell.at(-1)[2], name, fider);
        if(cell.at(-1)[2]==="currentTable") {setRelay(lastData);}
        if(cell.at(-1)[2]==="voltageTable") {setVoltageRelay(lastData);}
        if(cell.at(-1)[2]==="measuringTable") {setMeasuringInstrument(lastData);}
        if(cell.at(-1)[2]==="transTable") {setCurrentTrans(lastData);}
        addSwitch.current = '';
      }
      else{ //Изменяем уже существующее реле
        let lastData = await changeRelay(initRelayRef, changedRelayRef, cell.at(-1)[2], name, fider);
        if(cell.at(-1)[2]==="currentTable") {setRelay(lastData);}
        if(cell.at(-1)[2]==="voltageTable") {setVoltageRelay(lastData);}
        if(cell.at(-1)[2]==="measuringTable") {setMeasuringInstrument(lastData);}
        if(cell.at(-1)[2]==="transTable") {setCurrentTrans(lastData);}
      } 
      setCell([]);
      column.current='';
      initRelayRef.current=[];
      enableCollectInitData.current=true;
      addSwitch.current='';
    }
  }

  const abort = ()=>{
    if(addSwitch.current==='addRelay'){
      let updatedCells = [...cell];
      updatedCells.splice(1, updatedCells.length-1);
      setCell(updatedCells);
      column.current='';
      initRelayRef.current=[];
      enableCollectInitData.current=true;
    }
    else{
      setCell([]);
      column.current='';
      initRelayRef.current=[];
      enableCollectInitData.current=true;

      setRowSF('');
      addSwitchSF.current='';
    }   
  }
  const handleClose = () => setShow(false); // для фильтра модального окна
  const handleShow = () => setShow(true);   // для фильтра модального окна

  //----------------------------------------------------------------------------------

  function addNewSF(){
    if(rowSF===''){
      let newRow = [...substation_fider];
      newRow.push('');
      setRowSF(newRow.length-1);
      setSubstation_fider(newRow);
      addSwitchSF.current = 'newItem';
    }  
  }
  function compareSF(index, rowSF){
    if(index === rowSF){
      return true;
    }
  }
  function changeSF(e){
    if(rowSF===''){
      let changedItem = e.currentTarget;
      initObjectRef.current = changedItem.previousSibling.textContent;
      setRowSF(changedItem.closest('tr').sectionRowIndex);
    }
  }
  const applyChanges = async (values)=>{
    if(rowSF!==''){
      if(name==='Substation' && addSwitchSF.current===''){
        if(values.sbs_fider.length>20){ alert('Too long data. Only 20 characters are available'); return;}
        if(values.sbs_fider!==''){
          for(let item of substation_fider){
            if(item===values.sbs_fider){
              alert('Such item esists!'); return;
            }
          }
          let data = await changeObjectSF(values.sbs_fider, initObjectRef.current, name);
          setSubstation_fider(data);
          setRowSF('');
          values.sbs_fider='';
          initObjectRef.current='';
        }
      }
      if(name==='Substation' && addSwitchSF.current==='newItem'){
        if(values.sbs_fider.length>20){ alert('Too long data. Only 20 characters are available'); return;}
        if(values.sbs_fider!==''){
          for(let item of substation_fider){
            if(item===values.sbs_fider){
              alert('Such item esists!'); return;
            }
          }
          substation_fider[rowSF]=values.sbs_fider;
          setSubstation_fider(substation_fider);
          setRowSF('');
          values.sbs_fider='';
          addSwitchSF.current='';
        }
      }
      if(name!=='Substation' && addSwitchSF.current===''){
        if(values.sbs_fider.length>5){ alert('Too long data. Only 5 characters are available'); return;}
        if(values.sbs_fider!==''){
          for(let item of substation_fider){
            if(item===values.sbs_fider){
              alert('Such item esists!'); return;
            }
          }
          let data = await changeObjectSF(values.sbs_fider, initObjectRef.current, name);
          setSubstation_fider(data);
          setRowSF('');
          values.sbs_fider='';
          initObjectRef.current='';
        }
      }
      if(name!=='Substation' && addSwitchSF.current==='newItem'){
        if(values.sbs_fider.length>5){ alert('Too long data. Only 5 characters are available'); return;}
        if(values.sbs_fider!==''){
          for(let item of substation_fider){
            if(item===values.sbs_fider){
              alert('Such item esists!'); return;
            }
          }
          let data = await changeObjectSF(values.sbs_fider, '', name);
          setSubstation_fider(data);
          setRowSF('');
          values.sbs_fider='';
          addSwitchSF.current='';
        }
      }
    }
  }
  const deleteObject = async (e)=>{
    if(rowSF===''){
      let objectToDel = e.currentTarget.previousSibling.previousSibling; 
      let row = objectToDel.closest("tr").sectionRowIndex;
      if(objectToDel.textContent===''){
        let aux = [...substation_fider];
        aux.pop();
        setSubstation_fider(aux);
        return;
      }
      let data = await deleteObjectSF(objectToDel.textContent, name);
      if(name==='Substation'){
        if(data.length===0){
          let aux = [...substation_fider];
          aux.splice(row,1);
          setSubstation_fider(aux);
        }
        else{alert('Fiders exist');}
      }
      else{
        if(data==='equipment exists') {alert('Equipment exists');}
        else {
          let aux = [...substation_fider];
          aux.splice(row,1);
          setSubstation_fider(aux);
        }
      }
    }
  }

  return (
    <>
      {table?(
        <>
          <Formik initialValues={{sbs_fider:''}} onSubmit= {applyChanges}>
            <Form>
              <Card className="card">
                <Navbar expand="lg" className="bg-body-tertiary" fixed="top">
                  <Col className='headerCol'>
                    <Button className='navButton' variant="secondary" onClick={()=>backWard()}>Back</Button>
                    <Button className='navButton' variant="secondary" onClick={()=>abort()}>Abort</Button>
                    <Button className='navButton' variant="secondary" type="submit">Apply changes</Button>
                    <div class="vertical-separator"></div>
                    <Button className='navButton' variant="info" onClick={handleShow}>Filter</Button>
                  </Col>
                  <h1>Relay equipment</h1>
                </Navbar>
              </Card>

              <Button className="addNew" variant="primary" size="sm" onClick={addNewSF} id='add_tableSF'>Add new</Button>
              <Table striped bordered hover size="sm" id='tableSF' className='tableClass'>
                <thead><tr><th>{name}</th></tr></thead>
                <tbody>
                  {substation_fider.map((substation_fider, index) => (
                    <tr key={index}>
                      <td id='tdTableSF'>
                        {
                          compareSF(index, rowSF)?<Field name="sbs_fider" type="text" className="form-control" autoComplete="off" id='substationFider'/>:
                          <Button id='data' className="me-auto" variant="link" onClick={()=>{currentFunction(substation_fider, name)}}>{substation_fider}</Button>
                        }
                        <Button className='tableButton' variant="primary" size="sm" onClick={(e)=>changeSF(e)}>Change</Button>
                        <Button className='tableButton' variant="danger" size="sm" onClick={(e)=>deleteObject(e)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Form>
          </Formik>
        </>
        )
      :
      (
      <>
        <Card className="card">
          <Navbar expand="lg" className="bg-body-tertiary" fixed="top">
            <Col className='headerCol'>
              <Button className='navButton' variant="secondary" onClick={()=>backWard()}>Back</Button>
              <Button className='navButton' variant="secondary" onClick={()=>abort()}>Abort</Button>
              <Button className='navButton' variant="secondary" onClick={()=>change(changedRelayRef, initRelayRef, name, fider)}>Apply changes</Button>
              <div class="vertical-separator"></div>
              <Button className='navButton' variant="info" onClick={handleShow}>Filter</Button>
            </Col>
            <h1>Relay equipment</h1>
          </Navbar>
        </Card>
        <Relays relay={relay} initRelayRef={initRelayRef} setCell={setCell} cell={cell} enableCollectInitData={enableCollectInitData}
        name={name} fider={fider} setRelay={setRelay} addSwitch={addSwitch} enableAddNewRef={enableAddNewRef}
        voltageRelay={voltageRelay} setVoltageRelay={setVoltageRelay} measuringInstrument={measuringInstrument} 
        setMeasuringInstrument={setMeasuringInstrument} currentTrans={currentTrans} setCurrentTrans={setCurrentTrans} column={column}/>
      </>
      )}
      <Filter setRelay={setRelay} setVoltageRelay={setVoltageRelay} setMeasuringInstrument={setMeasuringInstrument}
      setCurrentTrans={setCurrentTrans} show={show} handleClose={handleClose} setTable={setTable} enableAddNewRef={enableAddNewRef}/>
    </>
  );
};

export default List;