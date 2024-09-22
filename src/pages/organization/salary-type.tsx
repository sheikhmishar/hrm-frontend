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
import Select, {
  type DropDownEventHandler
} from '../../components/Select'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalize, capitalizeDelim } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetResponseType } from 'backend/@types/response'
import type SalaryType from 'backend/Entities/SalaryType'
import type {
  addSalaryType,
  allSalaryTypes,
  salaryTypeDetails,
  updateSalaryType
} from 'backend/controllers/salary-types'

const defaultSalaryType: SalaryType = {
  id: -1,
  name: '',
  status: 'active'
}

const visibleKeys = (
  Object.keys(defaultSalaryType) as (keyof SalaryType)[]
).filter(k => k !== 'id') as (keyof OmitKey<
  SalaryType,
  'id'
>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const SalaryTypePage = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [salaryType, setSalaryType] = useState<SalaryType>({
    ...defaultSalaryType
  })
  const onSalaryTypeChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setSalaryType(salaryType => ({ ...salaryType, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setSalaryType(salaryType => ({ ...salaryType, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setSalaryType(salaryType => ({ ...salaryType, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setSalaryType({ ...defaultSalaryType })

  const {
    refetch: refetchSalaryTypes,
    data: salaryTypes,
    isFetching
  } = useQuery({
    queryKey: ['salaryTypes', ServerSITEMAP.salaryTypes.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allSalaryTypes>>(
        ServerSITEMAP.salaryTypes.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: salaryTypeLoading } = useQuery({
    queryKey: ['salaryType', ServerSITEMAP.salaryTypes.getById, salaryType.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof salaryTypeDetails>>(
        ServerSITEMAP.salaryTypes.getById.replace(
          ServerSITEMAP.salaryTypes._params.id,
          salaryType.id.toString()
        )
      ),
    enabled: salaryType.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: salaryType => salaryType && setSalaryType(salaryType)
  })

  const { mutate: salaryTypeUpdate, isLoading: salaryTypeUpdateLoading } =
    useMutation({
      mutationKey: [
        'salaryTypeUpdate',
        ServerSITEMAP.salaryTypes.put,
        salaryType
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof updateSalaryType>>(
          ServerSITEMAP.salaryTypes.put.replace(
            ServerSITEMAP.salaryTypes._params.id,
            salaryType.id.toString()
          ),
          { method: 'put', body: JSON.stringify(salaryType) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchSalaryTypes()
      }
    })

  const { mutate: salaryTypeCreate, isLoading: salaryTypeCreateLoading } =
    useMutation({
      mutationKey: [
        'salaryTypeCreate',
        ServerSITEMAP.salaryTypes.post,
        salaryType
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addSalaryType>>(
          ServerSITEMAP.salaryTypes.post,
          { method: 'post', body: JSON.stringify(salaryType) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchSalaryTypes()
      }
    })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Salary Type</strong>
            </h4>
            <span className='text-primary'>Details</span>
          </div>
          {isFetching && (
            <div className='ms-3 spinner-border text-primary' role='status'>
              <span className="visually-hidden">Loading...</span>
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
        rows={(salaryTypes || [])
          .filter(salaryType =>
            visibleKeys.find(key =>
              salaryType[key]
                .toString()
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          )
          .map(salaryType =>
            visibleKeys
              .map(key => (
                <>
                  {salaryType[key].substring(0, 50) +
                    (salaryType[key].length > 50 ? '...' : '')}
                </>
              ))
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setSalaryType(st => ({ ...st, id: salaryType.id }))
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
          title={`${salaryType.id === -1 ? 'Add' : 'Update'} Salary Type`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<SalaryType, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={salaryTypeLoading}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={salaryType[k]}
                onChange={onSalaryTypeChange}
              />
            )
          )}
          {(['status'] satisfies KeysOfObjectOfType<SalaryType, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={salaryTypeLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={salaryType[k]}
                options={(
                  ['active', 'inactive'] satisfies SalaryType['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {salaryType.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                salaryTypeLoading ||
                salaryTypeCreateLoading ||
                salaryTypeUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                salaryType.id > 0 ? salaryTypeUpdate() : salaryTypeCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {salaryType.id > 0 ? 'Update' : 'Add'}
                {(salaryTypeLoading ||
                  salaryTypeCreateLoading ||
                  salaryTypeUpdateLoading) && (
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

export default SalaryTypePage
