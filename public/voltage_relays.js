import React from 'react';
import Table from 'react-bootstrap/Table';
import DropDownRelays from './drop_down_lists/drop_down_relays';
import DropDownCurrent from './drop_down_lists/drop_down_current';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import '../src/style/relay equipment tables.css';

function VoltageRelay({relay, dropDownTable, compare, cell, 
    dropDownRelaysList, newInputRelayRef, deleteRow, name, fider, addNew, sortRelay}) {
    return (
        <>
        <Row className ='tableLabel'>
            <Button className="addNew" variant="primary" size="sm" id="add_voltageTable" onClick={(e)=>addNew(e, name, fider)}>Add new</Button>
            <h5>Voltage Ralays</h5>
        </Row>
        <Table striped bordered hover size="sm" id="voltageTable" className='equipmentTable'>
            <thead>
                <tr>
                    <th>Substation</th>
                    <th>Fider</th>
                    <th>Relay Type</th>
                    <th>AC/DC</th>
                    <th>Relay Voltage</th>
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
                        {compare(cell,index,2,"voltageTable")?<DropDownRelays dropDownRelaysList={dropDownRelaysList} newInputRelayRef={newInputRelayRef}/>:item[2]}
                    </td>
                    <td onClick={(e)=>dropDownTable(e)}>
                        {compare(cell, index, 3,"voltageTable") ? <DropDownCurrent /> : item[3]}
                    </td>
                    <td onClick={(e)=>dropDownTable(e)}>
                        {compare(cell,index,4,"voltageTable") ? <Form.Control size="sm" type="text" autofocus="autofocus"/> : item[4]}
                    </td>
                    <td onClick={(e)=>dropDownTable(e)}>
                        {compare(cell,index,5,"voltageTable") ? <Form.Control size="sm" type="text" autofocus="autofocus"/> : item[5]}
                    </td>
                    <td onClick={(e)=>dropDownTable(e)}>
                        {compare(cell,index,6,"voltageTable") ? <Form.Control size="sm" type="text" autofocus="autofocus"/> : item[6]}
                    </td>
                    <td><Button variant="danger" size="sm" onClick={(e)=>deleteRow(e,name,fider)}>Delete</Button></td>
                </tr>
            ))}
            </tbody>
        </Table>
        </>
    );
}
  
export default VoltageRelay;