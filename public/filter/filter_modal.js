import React from 'react';
import FilterForm from './filter_form';
import Modal from 'react-bootstrap/Modal';

const Filter = ({setRelay, setVoltageRelay, setMeasuringInstrument, setCurrentTrans, show, handleClose, setTable, enableAddNewRef}) => {

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" backdrop="static" className='filterEquipment'>
        <Modal.Header>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FilterForm setRelay={setRelay} setVoltageRelay={setVoltageRelay} setMeasuringInstrument={setMeasuringInstrument}
          setCurrentTrans={setCurrentTrans} handleClose={handleClose} setTable={setTable} enableAddNewRef={enableAddNewRef}/>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default Filter;