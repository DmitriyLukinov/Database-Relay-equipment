import { object } from "yup";

export async function getSubstations() {
    const response = await fetch("/showSubstations", {
       method: "GET",
      headers: { "Accept": "application/json" }
    });
    const json_substations = await response.json();
    const substations = json_substations.map(item => item.substation);
    return substations;
}

export const getFider = async (item) => {
    var substation = { substation: item};
    const response = await fetch("/showFiders", {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(substation)
    });
    const json_fiders = await response.json();
    const fiders = json_fiders.map(item => item.fider);
    return fiders;
}

export const getRelays = async (item, name) => {
  var fider = { fider: item, substation: name };
  const response = await fetch("/showRelays", {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fider)
  });
  const json_relays = await response.json();
  const currentRelays = json_relays[0].map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_current, item.year, item.quantity]);
  const voltageRelays = json_relays[1].map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_voltage, item.year, item.quantity]);
  const measureInstruments = json_relays[2].map(item=>[item.substation, item.fider, item.device, item.device_type, item.measurement_limit,
    item.year, item.quantity, item.formatted_next_verification]);
  const currentTranses = json_relays[3].map(item=>[item.substation, item.fider, item.type, item.coil_05, item.coil_10p, item.year, item.quantity]);
  let fiderEquipment = [];
  fiderEquipment.push(currentRelays);
  fiderEquipment.push(voltageRelays);
  fiderEquipment.push(measureInstruments);
  fiderEquipment.push(currentTranses);
  return fiderEquipment;
}

export const changeRelay = async (initRelayRef, changedRelayRef, tableID, name, fider)=>{
  let data = {initData: initRelayRef.current, changedData: changedRelayRef.current, tableID: tableID, substation: name, fider: fider};
  const response = await fetch("/changeRelay", {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json_relays = await response.json();
  if(tableID==="currentTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_current, item.year, item.quantity]);
    return relays;
  }
  if(tableID==="voltageTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_voltage, item.year, item.quantity]);
    return relays;
  }
  if(tableID==="measuringTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.device, item.device_type, item.measurement_limit,
    item.year, item.quantity, item.formatted_next_verification]);
    return relays;
  }
  if(tableID==="transTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.type, item.coil_05, item.coil_10p, item.year, item.quantity]);
    return relays;
  }
}

export const changeObjectSF = async(newObject, oldOject, name)=>{
  let data = {newObject: newObject, oldOject: oldOject, substation: name}
  const response = await fetch ("/changeObjectSF",{
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const json_objects = await response.json();
  if(name==='Substation'){
    const substations = json_objects.map(item => item.substation);
    return substations;
  }
  else{
    const fiders = json_objects.map(item => item.fider);
    return fiders;
  }
}

export const deleteObjectSF = async(obj, name)=>{
  let data = {obj: obj, substation: name}
  const response = await fetch ("/deleteObjectSF",{
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if(name==='Substation'){
    const json_quantity = await response.json();
    return json_quantity;
  }
  else{
    const json_objects = await response.text();
    return json_objects;
  }
}

export const addRelay = async(changedRelayRef, tableID, name, fider)=>{
  let data = {changedData: changedRelayRef.current, substation: name, fider: fider, tableID: tableID};
  const response = await fetch("/addRelay", {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json_relays = await response.json();
  if(tableID==="currentTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_current, item.year, item.quantity]);
    return relays;
  }
  if(tableID==="voltageTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_voltage, item.year, item.quantity]);
    return relays;
  }
  if(tableID==="measuringTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.device, item.device_type, item.measurement_limit,
    item.year, item.quantity, item.formatted_next_verification]);
    return relays;
  }
  if(tableID==="transTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.type, item.coil_05, item.coil_10p, item.year, item.quantity]);
    return relays;
  }
}

export const deleteRelay = async(initRelayRef, name, fider, tableID)=>{
  let data = {initData: initRelayRef.current, substation: name, fider: fider, tableID: tableID};
  const response = await fetch("/deleteRelay", {
    method: "DELETE",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json_relays = await response.json();
  if(tableID==="currentTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_current, item.year, item.quantity]);
    return relays;
  }
  if(tableID==="voltageTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_voltage, item.year, item.quantity]);
    return relays;
  }
  if(tableID==="measuringTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.device, item.device_type, item.measurement_limit,
    item.year, item.quantity, item.formatted_next_verification]);
    return relays;
  }
  if(tableID==="transTable"){
    const relays = json_relays.map(item=>[item.substation, item.fider, item.type, item.coil_05, item.coil_10p, item.year, item.quantity]);
    return relays;
  }
}

export const getDropDownRelays = async (tableID, columnID)=>{
  let table = { table: tableID, column: columnID};
  const response = await fetch("/showDropDownRelays",{
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(table)
  });
  const json_dropDownRelays = await response.json();
  let dropDownRelays;
  if(tableID==="currentTable" || tableID==="voltageTable"){
    dropDownRelays = json_dropDownRelays.map(item=>item.relay_type);
  }
  if(tableID==="measuringTable" && columnID===2){
    dropDownRelays = json_dropDownRelays.map(item=>item.device);
  }
  if(tableID==="measuringTable" && columnID===3){
    dropDownRelays = json_dropDownRelays.map(item=>item.device_type);
  }
  if(tableID==="transTable"){
    dropDownRelays = json_dropDownRelays.map(item=>item.type);
  }
  return dropDownRelays;
}

export const getDropDownRange = async (tableID)=>{
  let table = { table: tableID };
  const response = await fetch("/showDropDownRange",{
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(table)
  });
  const json_dropDownRanges = await response.json();
  let dropDownRanges;
  if(tableID==="currentTable"){
    dropDownRanges = json_dropDownRanges.map(item=>item.relay_current);
  }
  if(tableID==="measuringTable"){
    dropDownRanges = json_dropDownRanges.map(item=>item.measurement_limit);
  }
  if(tableID==="transTable"){
    dropDownRanges = json_dropDownRanges.map(item=>item.coils);
  }
  return dropDownRanges;
}

export const submitFormFetch = async (values) => {
  const response = await fetch("/form",{
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values, null, 2)
  })
  const json_relays = await response.json();
  const currentRelays = json_relays[0].map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_current, item.year, item.quantity]);
  const voltageRelays = json_relays[1].map(item=>[item.substation, item.fider, item.relay_type, item.ac_dc, item.relay_voltage, item.year, item.quantity]);
  const measureInstruments = json_relays[2].map(item=>[item.substation, item.fider, item.device, item.device_type, item.measurement_limit,
    item.year, item.quantity, item.formatted_next_verification]);
  const currentTranses = json_relays[3].map(item=>[item.substation, item.fider, item.type, item.coil_05, item.coil_10p, item.year, item.quantity]);
  let fiderEquipment = [];
  fiderEquipment.push(currentRelays);
  fiderEquipment.push(voltageRelays);
  fiderEquipment.push(measureInstruments);
  fiderEquipment.push(currentTranses);
  return fiderEquipment;
}