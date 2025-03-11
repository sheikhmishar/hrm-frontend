import { useMutation, useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import { Fragment, useContext, useState } from 'react'

import Button from '../../components/Button'
import Select from '../../components/Select'
import { BLANK_ARRAY } from '../../constants/CONSTANTS'
import {
  defaultAttendance,
  defaultEmployee
} from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import {
  capitalizeDelim,
  downloadStringAsFile,
  getEmployeeId
} from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import { GetResponseType } from 'backend/@types/response'
import EmployeeAttendance from 'backend/Entities/EmployeeAttendance'
import { addEmployeeAttendance } from 'backend/controllers/attendances'
import { allEmployees } from 'backend/controllers/employees'

type CSVColumns =
  | keyof Pick<EmployeeAttendance, 'arrivalTime' | 'leaveTime' | 'date'>
  | 'employeeId'
type CSVResult = { [x in CSVColumns]?: string }
const csvHeaders = (
  ['arrivalTime', 'leaveTime', 'date', 'employeeId'] satisfies CSVColumns[]
).join(',')

const ImportAttendance = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const [attendances, setAttendances] = useState<EmployeeAttendance[]>([])

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

  const { mutate, isLoading: _isLoading } = useMutation({
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

  const isLoading = _isLoading || employeesLoading

  return (
    <>
      <div className='align-items-center mb-3 row'>
        <div className='col'>
          <h4 className='m-0'>Download Sample CSV</h4>
        </div>
        <div className='col text-end'>
          <a
            className='btn btn-primary'
            href={`${import.meta.env.REACT_APP_BASE_URL}/attendance.csv`}
            onClick={e => {
              e.preventDefault()
              downloadStringAsFile(csvHeaders, 'attendance.csv', {
                type: 'text/csv'
              })
            }}
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
            onChange={async ({ target: { files } }) => {
              if (!files?.[0]) return

              const result = Papa.parse<CSVResult>(await files[0].text(), {
                header: true,
                skipEmptyLines: 'greedy',
                dynamicTyping: false
              })

              const data = result.data.map(row => {
                const {
                  arrivalTime = defaultAttendance.arrivalTime,
                  leaveTime = defaultAttendance.leaveTime,
                  date = defaultAttendance.date,
                  employeeId = defaultAttendance.id.toString()
                } = row
                const idString = employeeId.padStart(6, '0')
                const [yy, mm, id] = (
                  [
                    [0, 2],
                    [2, 4],
                    [4, 6]
                  ] as const
                ).map(([start, end]) => idString.substring(start, end)) as [
                  string,
                  string,
                  string
                ]
                const employee = employees.find(employee => {
                  const [joiningYY, joiningMM] = (
                    [
                      [2, 4],
                      [5, 7]
                    ] as const
                  ).map(([start, end]) =>
                    employee.dateOfJoining.substring(start, end)
                  ) as [string, string]

                  return (
                    joiningYY === yy &&
                    joiningMM === mm &&
                    employee.id.toString().substr(-2).padStart(2, '0') === id
                  )
                })

                return {
                  ...defaultAttendance,
                  arrivalTime,
                  leaveTime,
                  date,
                  employee: {
                    ...defaultAttendance.employee,
                    id:
                      employee?.id || parseInt(employeeId) || defaultEmployee.id
                  }
                } satisfies EmployeeAttendance
              })
              if (data.length) setAttendances(data)
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
                  <Fragment key={i}>
                    <tr>
                      <td>
                        <input
                          id='csvFileInput'
                          disabled={isLoading}
                          className='form-control'
                          type='date'
                          name={'date' satisfies keyof EmployeeAttendance}
                          value={attendance.date}
                          onChange={({ target: { value } }) => {
                            const newAttendances = [...attendances]
                            if (newAttendances[i])
                              newAttendances[i]!.date = value

                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <input
                          disabled={isLoading}
                          className='form-control'
                          type='time'
                          name={
                            'arrivalTime' satisfies keyof EmployeeAttendance
                          }
                          value={attendance.arrivalTime}
                          onChange={({ target: { value } }) => {
                            const newAttendances = [...attendances]
                            if (newAttendances[i])
                              newAttendances[i]!.arrivalTime = value
                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <input
                          disabled={isLoading}
                          className='form-control'
                          type='time'
                          name={'leaveTime' satisfies keyof EmployeeAttendance}
                          value={attendance.leaveTime}
                          onChange={({ target: { value } }) => {
                            const newAttendances = [...attendances]
                            if (newAttendances[i])
                              newAttendances[i]!.leaveTime = value
                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <Select
                          id={`employee_select${i}`}
                          disabled={isLoading}
                          label='Employee'
                          autoComplete='true'
                          options={employees
                            .filter(({ status }) => status === 'active')
                            .map(employee => ({
                              label: `${getEmployeeId(employee)} - ${
                                employee.name
                              }`,
                              value: employee.id
                            }))}
                          value={attendance.employee.id}
                          onChange={({ target: { value } }) => {
                            const newAttendances = [...attendances]
                            if (newAttendances[i])
                              newAttendances[i] = {
                                ...newAttendances[i]!,
                                employee: {
                                  ...newAttendances[i]!.employee,
                                  id: parseInt(value)
                                }
                              }
                            setAttendances(newAttendances)
                          }}
                        />
                      </td>
                      <td>
                        <Button
                          disabled={isLoading}
                          className='btn-outline-danger rounded-circle'
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
                        </Button>
                      </td>
                    </tr>
                    {attendanceErrorResponse?.data?.[i]?.error && (
                      <tr>
                        <td colSpan={5} className='table-danger'>
                          {attendanceErrorResponse.data[i]!.error}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <div className='mb-3 text-center'>
              <Button
                disabled={isLoading}
                className='btn-primary'
                onClick={() =>
                  setAttendances(attendances => [
                    ...attendances,
                    { ...defaultAttendance, employee: { ...defaultEmployee } }
                  ])
                }
              >
                +
              </Button>
            </div>
            <div className='text-center'>
              <Button
                disabled={isLoading}
                className='btn-primary'
                onClick={() => mutate()}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ImportAttendance

// TODO: multi entry same data assignd
