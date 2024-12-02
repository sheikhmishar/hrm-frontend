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
import type DutyType from 'backend/Entities/DutyType'
import type {
  addDutyType,
  allDutyTypes,
  dutyTypeDetails,
  updateDutyType
} from 'backend/controllers/duty-types'

const defaultDutyType: DutyType = {
  id: -1,
  name: '',
  status: 'active'
}

const visibleKeys = (Object.keys(defaultDutyType) as (keyof DutyType)[]).filter(
  k => k !== 'id'
) as (keyof OmitKey<DutyType, 'id'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const DutyTypePage: React.FC<{ approval?: boolean }> = ({ approval }) => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [dutyType, setDutyType] = useState<DutyType>({
    ...defaultDutyType
  })
  const onDutyTypeChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setDutyType(dutyType => ({ ...dutyType, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setDutyType(dutyType => ({ ...dutyType, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setDutyType(dutyType => ({ ...dutyType, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setDutyType({ ...defaultDutyType })

  const {
    refetch: refetchDutyTypes,
    data: dutyTypes,
    isFetching
  } = useQuery({
    queryKey: ['dutyTypes', ServerSITEMAP.dutyTypes.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDutyTypes>>(
        ServerSITEMAP.dutyTypes.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: dutyTypeLoading } = useQuery({
    queryKey: ['dutyType', ServerSITEMAP.dutyTypes.getById, dutyType.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof dutyTypeDetails>>(
        ServerSITEMAP.dutyTypes.getById.replace(
          ServerSITEMAP.dutyTypes._params.id,
          dutyType.id.toString()
        )
      ),
    enabled: dutyType.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: dutyType => dutyType && setDutyType(dutyType)
  })

  const { mutate: dutyTypeUpdate, isLoading: dutyTypeUpdateLoading } =
    useMutation({
      mutationKey: ['dutyTypeUpdate', ServerSITEMAP.dutyTypes.put],
      mutationFn: ({
        id,
        dutyType
      }: {
        id: number
        dutyType: Partial<DutyType>
      }) =>
        modifiedFetch<GetResponseType<typeof updateDutyType>>(
          ServerSITEMAP.dutyTypes.put.replace(
            ServerSITEMAP.dutyTypes._params.id,
            id.toString()
          ),
          {
            method: 'put',
            body: JSON.stringify(
              dutyType satisfies GetReqBodyType<typeof updateDutyType>
            )
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        setSidebar(false)
        refetchDutyTypes()
      }
    })

  const { mutate: dutyTypeCreate, isLoading: dutyTypeCreateLoading } =
    useMutation({
      mutationKey: ['dutyTypeCreate', ServerSITEMAP.dutyTypes.post, dutyType],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addDutyType>>(
          ServerSITEMAP.dutyTypes.post,
          { method: 'post', body: JSON.stringify(dutyType) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchDutyTypes()
      }
    })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Duty Type</strong>
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
        rows={(dutyTypes || [])
          .filter(
            dutyType =>
              (approval
                ? dutyType.status === 'inactive'
                : dutyType.status === 'active') &&
              visibleKeys.find(key =>
                dutyType[key]
                  .toString()
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
          )
          .map(dutyType =>
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
                      dutyTypeUpdate({
                        id: dutyType.id,
                        dutyType: { status: approval ? 'active' : 'inactive' }
                      })
                    }
                  >
                    {dutyType[key]}
                  </span>
                ) : (
                  <>
                    {dutyType[key].substring(0, 50) +
                      (dutyType[key].length > 50 ? '...' : '')}
                  </>
                )
              )
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setDutyType(d => ({ ...d, id: dutyType.id }))
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
          title={`${dutyType.id === -1 ? 'Add' : 'Update'} Duty Type`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<DutyType, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={dutyTypeLoading}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={dutyType[k]}
                onChange={onDutyTypeChange}
              />
            )
          )}
          {(['status'] satisfies KeysOfObjectOfType<DutyType, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={dutyTypeLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={dutyType[k]}
                options={(
                  ['active', 'inactive'] satisfies DutyType['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {dutyType.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                dutyTypeLoading ||
                dutyTypeCreateLoading ||
                dutyTypeUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                dutyType.id > 0
                  ? dutyTypeUpdate({ id: dutyType.id, dutyType })
                  : dutyTypeCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {dutyType.id > 0 ? 'Update' : 'Add'}
                {(dutyTypeLoading ||
                  dutyTypeCreateLoading ||
                  dutyTypeUpdateLoading) && (
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

export default DutyTypePage
