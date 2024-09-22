import Input from '../../components/Input'

const Assets = () => {
  return (
    <div className='row'>
      <div className='col-12 col-md-7'>
        <Input
          id='sdd'
          containerClass='my-3'
          placeholder='Search Employee by Id, Name or Asset'
          label=''
        />
      </div>
      <div className='col-12 my-2'>
        <div className='border-0 card shadow-sm'>
          <div className='card-body'>
            <div className='align-items-center d-flex gap-3 my-3'>
              <img
                src='/favicon.png'
                alt=''
                className='cursor-pointer object-fit-cover rounded-circle'
                height='60'
                width='60'
              />
              <div>
                <p className='fw-bold m-0 rounded-3 text-info'>Jewel Rana</p>
                <p className='m-0'>SkyLane Group</p>
                <p className='m-0'>230560</p>
              </div>
            </div>
            <table className='mt-2 table table-borderless'>
              <thead>
                <tr>
                  <th className='text-warning'>Asset Name</th>
                  <th className='text-warning'>Description</th>
                  <th className='text-warning'>Given Date</th>
                  <th className='text-warning'>Return Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mobile Phone</td>
                  <td> Samsung A12 </td>
                  <td>(Old Phone)</td>
                  <td>2023-12-15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Assets
