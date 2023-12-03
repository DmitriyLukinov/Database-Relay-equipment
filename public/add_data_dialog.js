import React from 'react';

const AddDataDialog = ({ column, setDropDownRelaysList, setDropDownRangeList, setDropDownDeviceTypeList,
  newInputRelayRef, newInputRangeRef, newInputDeviceTypeRef}) => {

  function newItem(a) {
    if(a===2){
      setDropDownRelaysList([newInputRelayRef.current]);
    }
    else if(a===3){
      setDropDownDeviceTypeList([newInputDeviceTypeRef.current]);
    }
    else if(a===4){
      setDropDownRangeList([newInputRangeRef.current]);
    }
    document.getElementById('data').value ='';   
  }
  function inlineCheck(e, a){
    if(a===2){newInputRelayRef.current = e.target.value}
    if(a===3){newInputDeviceTypeRef.current = e.target.value}
    if(a===4){newInputRangeRef.current = e.target.value}
  }

  return (
    <div class="modal fade" id="modalAddNewData" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" data-backdrop="static">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">New data</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="recipient-name" class="col-form-label">Enter parameter:</label>
              <input type="text" class="form-control" id="data" onChange={(e)=>inlineCheck(e,column.current)}></input>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={()=>newItem(column.current)}>Add new</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDataDialog;