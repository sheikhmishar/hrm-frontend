import { useMutation, useQuery } from '@tanstack/react-query'
import Papa, { ParseResult } from 'papaparse'
import { useContext, useState } from 'react'

import Select from '../../components/Select'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalizeDelim } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import Employee from 'backend/Entities/Employee'
import EmployeeAttendance from 'backend/Entities/EmployeeAttendance'
import { addEmployeeAttendance } from 'backend/controllers/attendances'
import { allEmployees } from 'backend/controllers/employees'

const defaultAttendance: Omit<EmployeeAttendance, 'id'> = {
  arrivalTime: '00:00:00',
  leaveTime: '00:00:00',
  date: new Date().toISOString().split('T')[0]!,
  // @ts-ignore // FIXME
  employee: { id: -1 }
}

const ImportAttendance = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const [attendances, setAttendances] = useState<
    Omit<EmployeeAttendance, 'id'>[]
  >([])

  const { data: employees = BLANK_ARRAY, isFetching: employeesLoading } =
    useQuery({
      queryKey: ['employees', ServerSITEMAP.employees.get],
      queryFn: () =>
        modifiedFetch<GetResponseType<typeof allEmployees>>(
          ServerSITEMAP.employees.get
        ),
      onError: onErrorDisplayToast
    })

  const [attendanceErrorResponse, setAttendanceErrorResponse] =
    useState<GetResponseType<typeof addEmployeeAttendance>>()

  const { mutate } = useMutation({
    mutationKey: ['attendanceAdd', ServerSITEMAP.attendances.post, attendances],
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof addEmployeeAttendance>>(
        ServerSITEMAP.attendances.post,
        { method: 'post', body: JSON.stringify(attendances) }
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      if (!data) return
      data.message && addToast(data.message)
      if (!data.data) return
      const invalidDataIdxs =
        data.data
          .map((data, i) => (data.error ? i : -1))
          .filter(i => i !== -1) || []
      setAttendanceErrorResponse({
        ...data,
        data: data.data.filter((_, i) => invalidDataIdxs.includes(i))
      })
      setAttendances(attendances =>
        attendances.filter((_, i) => invalidDataIdxs.includes(i))
      )
    }
  })

  return (
    <div className='pt-5 px-4'>
      <div className='align-items-center mb-3 row'>
        <div className='col'>
          <h4 className='m-0'>Download Sample CSV</h4>
        </div>
        <div className='col text-end'>
          <a
            className='btn btn-primary'
            href={`${import.meta.env.REACT_APP_BASE_URL}/sample.csv`}
          >
            Download
          </a>
        </div>
      </div>
      <div className='align-items-center mb-3 row'>
        <div className='col'>
          <h4 className='m-0'>Load CSV</h4>
        </div>
        <div className='align-items-center col d-flex justify-content-end'>
          <input
            className='form-control me-2 w-75'
            type='file'
            accept='.csv'
            onChange={({ target: { files } }) => {
              const file = files?.[0]

              if (file) {
                Papa.parse(file, {
                  complete: (result: ParseResult<any>) => {
                    if (result.data.length > 0)
                      setAttendances(
                        result.data.map(row => ({
                          leaveTime: row.leaveTime,
                          arrivalTime: row.arrivalTime,
                          date: row.date,
                          employee: { id: row.employeeId } as Employee
                        }))
                      )
                  },
                  header: true,
                  skipEmptyLines: 'greedy',
                  dynamicTyping: true
                })
              }
            }}
          />
        </div>
      </div>
      <hr />
      <div className='row'>
        <div className='col'>
          <div className='table-responsive'>
            <table className='shadow-sm table table-hover'>
              <thead>
                <tr>
                  <th scope='col'>
                    {capitalizeDelim('date' satisfies keyof EmployeeAttendance)}
                  </th>
                  <th scope='col'>
                    {capitalizeDelim(
                      'arrivalTime' satisfies keyof EmployeeAttendance
                    )}
                  </th>
                  <th scope='col'>
                    {capitalizeDelim(
                      'leaveTime' satisfies keyof EmployeeAttendance
                    )}
                  </th>
                  <th scope='col'>ID</th>
                  <th scope='col'>...</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance, i) => (
                  <>
                    <tr>
                      <td>
                        <input
                          id='csvFileInput'
                          disabled={employeesLoading}
                          className='form-control'
                          type='date'
                          name={'date' satisfies keyof EmployeeAttendance}
                          value={attendance.date}
                          onChange={({ target: { valueAsDate } }) => {
                            const newAttendances = [...attendances]
                            if (attendances[i]?.date)
                              attendances[i]!.date = (valueAsDate || new Date())
                                .toISOString()
                                .split('T')[0]!
                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <input
                          disabled={employeesLoading}
                          className='form-control'
                          type='time'
                          name={
                            'arrivalTime' satisfies keyof EmployeeAttendance
                          }
                          value={attendance.arrivalTime}
                          onChange={({ target: { valueAsDate } }) => {
                            console.log(valueAsDate)

                            const newAttendances = [...attendances]
                            if (attendances[i]?.arrivalTime)
                              attendances[i]!.arrivalTime = (
                                valueAsDate || new Date()
                              )
                                .toISOString()
                                .substring(11, 16)
                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <input
                          disabled={employeesLoading}
                          className='form-control'
                          type='time'
                          name={'leaveTime' satisfies keyof EmployeeAttendance}
                          value={attendance.leaveTime}
                          onChange={({ target: { valueAsDate } }) => {
                            const newAttendances = [...attendances]
                            if (attendances[i]?.leaveTime)
                              attendances[i]!.leaveTime = (
                                valueAsDate || new Date()
                              )
                                .toISOString()
                                .substring(11, 16)
                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <Select
                          id={`employee_select${i}`}
                          disabled={employeesLoading}
                          label=''
                          autoComplete='true'
                          options={employees.map(employee => ({
                            label: `${employee.eId} - ${employee.name}`,
                            value: employee.id
                          }))}
                          value={attendance.employee.id}
                          onChange={({ target: { value } }) => {
                            const newAttendances = [...attendances]
                            if (attendances[i])
                              attendances[i]!.employee.id = parseInt(value)
                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <button
                          disabled={employeesLoading}
                          className='btn btn-outline-danger rounded-circle'
                          onClick={() => {
                            setAttendances(attendances =>
                              attendances.filter((_, idx) => idx !== i)
                            )
                            setAttendanceErrorResponse(
                              attendanceAddResponse => {
                                if (!attendanceAddResponse) return

                                return {
                                  ...attendanceAddResponse,
                                  data: [
                                    ...(attendanceAddResponse.data?.filter(
                                      (_, idx) => idx !== i
                                    ) || [])
                                  ]
                                }
                              }
                            )
                          }}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                    {attendanceErrorResponse?.data?.[i]?.error && (
                      <tr>
                        <td colSpan={5} className='table-danger'>
                          {attendanceErrorResponse.data[i]!.error}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            <div className='mb-3 text-center'>
              <button
                className='btn btn-primary'
                onClick={() =>
                  setAttendances(attendances => [
                    ...attendances,
                    { ...defaultAttendance }
                  ])
                }
              >
                +
              </button>
            </div>
            <div className='text-center'>
              <button className='btn btn-primary' onClick={() => mutate()}>
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportAttendance
