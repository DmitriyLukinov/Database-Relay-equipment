import React from 'react';
import Form from 'react-bootstrap/Form';

const DropDownRelays = ({ dropDownRelaysList, newInputRelayRef }) => {

    function showDialog(e){
        const selectedOption = e.currentTarget.selectedOptions[0].text;
        if(selectedOption==='add new'){
            const modal = document.getElementById('modalAddNewData');
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
        }
    }

    return ( 
        <>
            <Form.Select size="sm" value={newInputRelayRef.current} onChange={(e) => showDialog(e)}>
                <option>{dropDownRelaysList[0]}</option>
                {dropDownRelaysList.slice(1).map(function (item, index) {
                    return (
                        <option key={index} value={item}>{item}</option>
                    )
                })}
                <option>add new</option>
            </Form.Select>
        </>       
    );
};

export default DropDownRelays;