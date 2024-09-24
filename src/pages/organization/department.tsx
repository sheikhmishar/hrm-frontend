import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useCallback,
  useContext,
  useState,
  type ChangeEventHandler
} from 'react'
import { FaPen, FaPlus, FaRotateLeft } from 'react-icons/fa6'

import Button from '../../components/Button'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import Select, { type DropDownEventHandler } from '../../components/Select'
import Table from '../../components/Table'
import { defaultDepartment } from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalize, capitalizeDelim } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type Department from 'backend/Entities/Department'
import type {
  addDepartment,
  allDepartments,
  departmentDetails,
  updateDepartment
} from 'backend/controllers/departments'

const visibleKeys = (
  Object.keys(defaultDepartment) as (keyof Department)[]
).filter(k => k !== 'id') as (keyof OmitKey<Department, 'id'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const DepartmentPage = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [department, setDepartment] = useState<Department>({
    ...defaultDepartment
  })
  const onDepartmentChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setDepartment(department => ({ ...department, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setDepartment(department => ({ ...department, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setDepartment(department => ({ ...department, _id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setDepartment({ ...defaultDepartment })

  const {
    refetch: refetchDepartments,
    data: departments,
    isFetching
  } = useQuery({
    queryKey: ['departments', ServerSITEMAP.departments.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDepartments>>(
        ServerSITEMAP.departments.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: departmentLoading } = useQuery({
    queryKey: ['department', ServerSITEMAP.departments.getById, department.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof departmentDetails>>(
        ServerSITEMAP.departments.getById.replace(
          ServerSITEMAP.departments._params.id,
          department.id.toString()
        )
      ),
    enabled: department.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: department => department && setDepartment(department)
  })

  const { mutate: departmentUpdate, isLoading: departmentUpdateLoading } =
    useMutation({
      mutationKey: [
        'departmentUpdate',
        ServerSITEMAP.departments.put,
        department
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof updateDepartment>>(
          ServerSITEMAP.departments.put.replace(
            ServerSITEMAP.departments._params.id,
            department.id.toString()
          ),
          { method: 'put', body: JSON.stringify(department) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchDepartments()
      }
    })

  const { mutate: departmentCreate, isLoading: departmentCreateLoading } =
    useMutation({
      mutationKey: [
        'departmentCreate',
        ServerSITEMAP.departments.post,
        department
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addDepartment>>(
          ServerSITEMAP.departments.post,
          { method: 'post', body: JSON.stringify(department) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchDepartments()
      }
    })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Department</strong>
            </h4>
            <span className='text-primary'>Details</span>
          </div>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          )}
          <div className='ms-auto w-25'>
            <input
              className='form-control py-2 rounded-3'
              id='search'
              placeholder='Search here'
              onChange={onSearchInputChange}
              value={search}
            />
          </div>
          <div>
            <Button
              onClick={() => {
                toggleSidebar()
                resetData()
              }}
              className='btn-primary ms-2'
            >
              Add New <FaPlus />
            </Button>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        rows={(departments || [])
          .filter(department =>
            visibleKeys.find(key =>
              department[key]
                .toString()
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          )
          .map(department =>
            visibleKeys
              .map(key => (
                <>
                  {department[key].substring(0, 50) +
                    (department[key].length > 50 ? '...' : '')}
                </>
              ))
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setDepartment(d => ({ ...d, id: department.id }))
                    toggleSidebar()
                  }}
                >
                  <FaPen />
                </Button>
              )
          )}
      />

      <Modal isOpen={sidebar} setIsOpen={setSidebar}>
        <Modal.Header
          title={`${department.id === -1 ? 'Add' : 'Update'} Department`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<Department, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={departmentLoading}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={department[k]}
                onChange={onDepartmentChange}
              />
            )
          )}
          {(['status'] satisfies KeysOfObjectOfType<Department, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={departmentLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={department[k]}
                options={(
                  ['active', 'inactive'] satisfies Department['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {department.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                departmentLoading ||
                departmentCreateLoading ||
                departmentUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                department.id > 0 ? departmentUpdate() : departmentCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {department.id > 0 ? 'Update' : 'Add'}
                {(departmentLoading ||
                  departmentCreateLoading ||
                  departmentUpdateLoading) && (
                  <div
                    className='ms-2 spinner-border spinner-border-sm text-light'
                    role='status'
                  >
                    <span className='visually-hidden'>Loading...</span>
                  </div>
                )}
              </span>
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default DepartmentPage
