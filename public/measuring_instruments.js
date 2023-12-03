import React from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import DropDownRelays from './drop_down_lists/drop_down_relays';
import DropDownDeviceType from './drop_down_lists/drop_down_device_type';
import DropDownRange from './drop_down_lists/drop_down_range';
import '../src/style/relay equipment tables.css';

function MeasuringInstruments({relay, dropDownTable, compare, cell, dropDownRelaysList, dropDownDeviceTypeList, dropDownRangeList,
    newInputRelayRef, newInputDeviceTypeRef, newInputRangeRef, deleteRow, name, fider, addNew, sortRelay}){
    return(
        <>
            <Row className ='tableLabel'>
                <Button className="addNew" variant="primary" size="sm" id="add_measuringTable" onClick={(e)=>addNew(e, name, fider)}>Add new</Button>
                <h5>Measuring Instruments</h5>
            </Row>
            <Table striped bordered hover size="sm" id="measuringTable" className='equipmentTable'>
            <thead>
                <tr>
                    <th>Substation</th>
                    <th>Fider</th>
                    <th>Device</th>
                    <th>Device type</th>
                    <th>Limit</th>
                    <th>
                        Year
                        <svg onClick={(e)=>sortRelay(e)} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16">
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
                        </svg>
                    </th>
                    <th>Quantity</th>
                    <th>Next verification</th>
                    <th>Delete</th>
                </tr>
            </thead>
            <tbody>
            {
                relay.map((item, index)=>(
                    <tr key={index}>
                        <td>{item[0]}</td>
                        <td>{item[1]}</td>
                        <td onClick={(e)=>dropDownTable(e)}>
                            {compare(cell,index,2,"measuringTable")?
                            <DropDownRelays 
                                dropDownRelaysList={dropDownRelaysList} 
                                newInputRelayRef={newInputRelayRef}
                            />:
                            item[2]}
                        </td>
                        <td onClick={(e)=>dropDownTable(e)}>
                            {compare(cell,index,3,"measuringTable")?
                            <DropDownDeviceType 
                                dropDownDeviceTypeList={dropDownDeviceTypeList} 
                                newInputDeviceTypeRef={newInputDeviceTypeRef}
                            />:
                            item[3]}
                        </td>
                        <td onClick={(e)=>dropDownTable(e)}>
                            {compare(cell,index,4,"measuringTable")?
                            <DropDownRange
                                dropDownRangeList={dropDownRangeList}
                                newInputRangeRef={newInputRangeRef}
                            />:
                            item[4]}
                        </td>
                        <td onClick={(e)=>dropDownTable(e)}>
                            {compare(cell,index,5,"measuringTable")? <Form.Control size="sm" type="text" autofocus="autofocus"/>:item[5]}
                        </td>
                        <td onClick={(e)=>dropDownTable(e)}>
                            {compare(cell,index,6,"measuringTable")? <Form.Control size="sm" type="text" autofocus="autofocus"/>:item[6]}
                        </td>
                        <td onClick={(e)=>dropDownTable(e)}>
                            {compare(cell,index,7,"measuringTable")? <Form.Control size="sm" type="text" autofocus="autofocus"/>:item[7]}
                        </td>
                        <td><Button variant="danger" size="sm" onClick={(e)=>deleteRow(e,name,fider)}>Delete</Button></td>
                    </tr>
                ))
            }
            </tbody>
            </Table>
        </>
    )
}

export default MeasuringInstruments;