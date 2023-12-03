import React from 'react';
import { useState } from 'react';
import { Formik, Field, Form } from 'formik';
import { submitFormFetch } from '../fetches';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import '../../src/style/filter form.css';
 
const FilterForm = ({setRelay, setVoltageRelay, setMeasuringInstrument, setCurrentTrans, handleClose, setTable, enableAddNewRef}) => {

  const [showAttantion, setShowAttantion] = useState(false);

  const handleSubmit = async (values) => {
    if(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(?!0{1,3}\d)\d{4}$/.test(values.nextVerification)===false && values.nextVerification!=='' &&
      /^(0[1-9]|1[0-2])\.(?!0{1,3}\d)\d{4}$/.test(values.nextVerification)===false && /^(?!0{1,3}\d)\d{4}$/.test(values.nextVerification)===false){
      setShowAttantion(true);
    }
    else{
      handleClose();
      setTable(false); 
      const data = await submitFormFetch(values);
      setRelay(data[0]);
      setVoltageRelay(data[1]);
      setMeasuringInstrument(data[2]);
      setCurrentTrans(data[3]);
      enableAddNewRef.current=false; //Чтобы после срабатывания фильтра нельзя было добавить новую строку в таблицу.
    }
  };

  return (
    <>  
      <Formik initialValues={{ substation:'', fider:'', relayType:'', relayRange:'', voltageRelayType:'', voltageType:'', device:'', deviceType:'',
      limit:'', nextVerification:'', transType:'', coil_05:'', coil_10p:'', year:'', }} onSubmit= {handleSubmit}
      >
        <Form>
          <Container className='filterBody'>
            <Row className='bodyRow'>
              <Col>
                <label htmlFor="substation">Substation</label>
                <Field name="substation" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="fider">Fider</label>
                <Field name="fider" type="text" className="form-control" autoComplete="off"/>           
              </Col>
              <Col>
                <label htmlFor="relayType">Year</label>
                <Field name="year" type="text" className="form-control" autoComplete="off"/>
              </Col>
            </Row>
            <Row className='bodyRow'>
              <Col>
                <label htmlFor="relayType">Current relay type</label>
                <Field name="relayType" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="relayType">Current relay range</label>
                <Field name="relayRange" type="text" className="form-control" autoComplete="off"/>
              </Col>
            </Row>
            <Row className='bodyRow'> 
              <Col>
                <label htmlFor="voltageRelayType">Voltage relay type</label>
                <Field name="voltageRelayType" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="voltageType">=/~ (For voltage relays only)</label>
                <Field name="voltageType" type="text" className="form-control" autoComplete="off"/>
              </Col>
            </Row>
            <Row className='bodyRow'>
              <Col>
                <label htmlFor="device">M.I., device</label>
                <Field name="device" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="deviceType">M.I., type</label>
                <Field name="deviceType" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="limit">M.I., limit</label>
                <Field name="limit" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="nextVerification">Next verifacation</label>
                <Field name="nextVerification" type="text" className="form-control" autoComplete="off" id="nextVerification" onFocus={() => setShowAttantion(false)}/>
              </Col>
            </Row>
            <Row className='bodyRow'>
              <Col>
                <label htmlFor="transType">Current trans, type</label>
                <Field name="transType" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="coil_05">Coil 0.5</label>
                <Field name="coil_05" type="text" className="form-control" autoComplete="off"/>
              </Col>
              <Col>
                <label htmlFor="coil_10p">Coil 10P</label>
                <Field name="coil_10p" type="text" className="form-control" autoComplete="off"/>
              </Col>
            </Row>
          </Container>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button variant="primary" type="submit">Submit</Button> 
          </Modal.Footer>
        </Form>
      </Formik>
      <Overlay target={document.getElementById("nextVerification")} show={showAttantion} placement="right">
        <Popover>
          <Popover.Header as="h3" id='incorrectFormat'>Incorrect format</Popover.Header>
          <Popover.Body>
            <span>Only following formats are acceptible:</span>
            <ul>
              <li>day.month.year</li>
              <li>month.year</li>
              <li>year</li>
            </ul>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
    
  );
};

export default FilterForm;