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
import Select, { type DropDownEventHandler } from '../../components/Select'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalize, capitalizeDelim } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'

import type { GetReqBodyType, GetResponseType } from 'backend/@types/response'
import type DeductionType from 'backend/Entities/DeductionType'
import type {
  addDeductionType,
  allDeductionTypes,
  deductionTypeDetails,
  updateDeductionType
} from 'backend/controllers/deduction-types'

const defaultDeductionType: DeductionType = {
  id: -1,
  name: '',
  status: 'active'
}

const visibleKeys = (
  Object.keys(defaultDeductionType) as (keyof DeductionType)[]
).filter(k => k !== 'id') as (keyof OmitKey<DeductionType, 'id'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const DeductionTypePage: React.FC<{ approval?: boolean }> = ({ approval }) => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [deductionType, setDeductionType] = useState<DeductionType>({
    ...defaultDeductionType
  })
  const onDeductionTypeChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setDeductionType(deductionType => ({ ...deductionType, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setDeductionType(deductionType => ({ ...deductionType, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setDeductionType(deductionType => ({ ...deductionType, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setDeductionType({ ...defaultDeductionType })

  const {
    refetch: refetchDeductionTypes,
    data: deductionTypes,
    isFetching
  } = useQuery({
    queryKey: ['deductionTypes', ServerSITEMAP.deductionTypes.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDeductionTypes>>(
        ServerSITEMAP.deductionTypes.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: deductionTypeLoading } = useQuery({
    queryKey: ['deductionType', ServerSITEMAP.deductionTypes.getById, deductionType.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof deductionTypeDetails>>(
        ServerSITEMAP.deductionTypes.getById.replace(
          ServerSITEMAP.deductionTypes._params.id,
          deductionType.id.toString()
        )
      ),
    enabled: deductionType.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: deductionType => deductionType && setDeductionType(deductionType)
  })

  const { mutate: deductionTypeUpdate, isLoading: deductionTypeUpdateLoading } =
    useMutation({
      mutationKey: ['deductionTypeUpdate', ServerSITEMAP.deductionTypes.put],
      mutationFn: ({
        id,
        deductionType
      }: {
        id: number
        deductionType: Partial<DeductionType>
      }) =>
        modifiedFetch<GetResponseType<typeof updateDeductionType>>(
          ServerSITEMAP.deductionTypes.put.replace(
            ServerSITEMAP.deductionTypes._params.id,
            id.toString()
          ),
          {
            method: 'put',
            body: JSON.stringify(
              deductionType satisfies GetReqBodyType<typeof updateDeductionType>
            )
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        setSidebar(false)
        refetchDeductionTypes()
      }
    })

  const { mutate: deductionTypeCreate, isLoading: deductionTypeCreateLoading } =
    useMutation({
      mutationKey: [
        'deductionTypeCreate',
        ServerSITEMAP.deductionTypes.post,
        deductionType
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addDeductionType>>(
          ServerSITEMAP.deductionTypes.post,
          { method: 'post', body: JSON.stringify(deductionType) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchDeductionTypes()
      }
    })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Deduction Type</strong>
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
        rows={(deductionTypes || [])
          .filter(
            deductionType =>
              (approval
                ? deductionType.status === 'inactive'
                : deductionType.status === 'active') &&
              visibleKeys.find(key =>
                deductionType[key]
                  .toString()
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
          )
          .map(deductionType =>
            visibleKeys
              .map(key =>
                key === 'status' ? (
                  <span
                    className={`p-1 rounded ${
                      approval
                        ? 'text-bg-danger bg-opacity-50'
                        : 'text-bg-primary'
                    }`}
                    role='button'
                    onClick={() =>
                      deductionTypeUpdate({
                        id: deductionType.id,
                        deductionType: { status: approval ? 'active' : 'inactive' }
                      })
                    }
                  >
                    {deductionType[key]}
                  </span>
                ) : (
                  <>
                    {deductionType[key].substring(0, 50) +
                      (deductionType[key].length > 50 ? '...' : '')}
                  </>
                )
              )
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setDeductionType(st => ({ ...st, id: deductionType.id }))
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
          title={`${deductionType.id === -1 ? 'Add' : 'Update'} Deduction Type`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<DeductionType, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={deductionTypeLoading}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={deductionType[k]}
                onChange={onDeductionTypeChange}
              />
            )
          )}
          {(['status'] satisfies KeysOfObjectOfType<DeductionType, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={deductionTypeLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={deductionType[k]}
                options={(
                  ['active', 'inactive'] satisfies DeductionType['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {deductionType.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                deductionTypeLoading ||
                deductionTypeCreateLoading ||
                deductionTypeUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                deductionType.id > 0
                  ? deductionTypeUpdate({ id: deductionType.id, deductionType })
                  : deductionTypeCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {deductionType.id > 0 ? 'Update' : 'Add'}
                {(deductionTypeLoading ||
                  deductionTypeCreateLoading ||
                  deductionTypeUpdateLoading) && (
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

export default DeductionTypePage
