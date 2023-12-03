import React from 'react';
import Form from 'react-bootstrap/Form';

const DropDownRange = ({ dropDownRangeList, newInputRangeRef }) => {

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
            <Form.Select size="sm" value={newInputRangeRef.current} onChange={(e) => showDialog(e)}>
                <option>{dropDownRangeList[0]}</option>
                {dropDownRangeList.slice(1).map(function (item, index) {
                    return (
                        <option key={index} value={item}>{item}</option>
                    )
                })}
                <option>add new</option>
            </Form.Select>
        </>
    );
};

export default DropDownRange;