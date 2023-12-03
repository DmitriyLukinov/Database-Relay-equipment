import React, { useState, useRef } from 'react';
import List from './List';
import { getSubstations, getFider, getRelays, } from './fetches';

const Substations_Fiders = () => {
  const [table, setTable] = useState(true);
  const [substation_fider, setSubstation_fider] = useState([]);
  const [name, setName] = useState('Substation');
  const [fider, setFider] = useState();
  const [relay, setRelay] = useState([]); // для токовых реле
  const [voltageRelay, setVoltageRelay] = useState([]); //для реле напряжения
  const [measuringInstrument, setMeasuringInstrument]= useState([]); //для СИТ
  const [currentTrans, setCurrentTrans]=useState([]); //для ТТ
  const [cell, setCell] = useState([]);

  const column = useRef('');
  const enableCollectInitData = useRef(true);
  const initRelayRef = useRef([]);
  const addSwitch = useRef('');

  const fiders = async (item)=>{
    setName(item);
    const data = await getFider(item);
    setSubstation_fider(data);
    currentFunction.current = relays;

    setRowSF('');
    initObjectRef.current = '';
    addSwitchSF.current = '';
  }

  const currentFunction = useRef(fiders);
  const currentButton = useRef(true);
  const enableAddNewRef = useRef(true); //Чтобы после срабатывания фильтра нельзя было добавить новую строку в таблицу.

  const [rowSF, setRowSF]= useState('');
  let initObjectRef = useRef('');
  let addSwitchSF = useRef('');

  const relays = async (substation_fider, name)=>{
    const data = await getRelays(substation_fider, name);
    setRelay(data[0]);
    setVoltageRelay(data[1]);
    setMeasuringInstrument(data[2]);
    setCurrentTrans(data[3]);
    setTable(false); 
    setFider(substation_fider);
    currentButton.current=false;

    setRowSF('');
    initObjectRef.current = '';
    addSwitchSF.current = '';
  }

  const backWard = ()=>{
    enableAddNewRef.current=true;
    if(currentButton.current===true) {
      async function fetchData() {
        setSubstation_fider(await getSubstations());
        setTable(true);
        setName('Substation');
        currentFunction.current=fiders;

        setRowSF('');
        initObjectRef.current = '';
        addSwitchSF.current = '';
      }   
      fetchData();
    }
    else{
      setCell([]);
      column.current='';
      initRelayRef.current = [];
      enableCollectInitData.current=true;
      setTable(true);
      currentButton.current=true;
      addSwitch.current='';

      setRowSF('');
      initObjectRef.current = '';
      addSwitchSF.current = '';
    }
  }
  
  return (
    <>
      <List
        table={table} 
        substation_fider={substation_fider} 
        setSubstation_fider={setSubstation_fider} 
        backWard={backWard}
        relay={relay} 
        name={name} 
        currentFunction={currentFunction.current} 
        fider={fider} 
        setRelay={setRelay} 
        cell={cell} 
        setCell={setCell} 
        setTable={setTable} 
        enableAddNewRef={enableAddNewRef}
        voltageRelay={voltageRelay}
        setVoltageRelay={setVoltageRelay}
        measuringInstrument={measuringInstrument}
        setMeasuringInstrument={setMeasuringInstrument}
        currentTrans={currentTrans}
        setCurrentTrans={setCurrentTrans}
        enableCollectInitData={enableCollectInitData}
        initRelayRef = {initRelayRef}
        addSwitch = {addSwitch}
        column = {column}
        rowSF={rowSF}
        setRowSF={setRowSF}
        initObjectRef={initObjectRef}
        addSwitchSF={addSwitchSF}
      />
    </>
  );
};

export default Substations_Fiders;