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
import type BonusType from 'backend/Entities/BonusType'
import type {
  addBonusType,
  allBonusTypes,
  bonusTypeDetails,
  updateBonusType
} from 'backend/controllers/bonus-types'

const defaultBonusType: BonusType = {
  id: -1,
  name: '',
  status: 'active'
}

const visibleKeys = (
  Object.keys(defaultBonusType) as (keyof BonusType)[]
).filter(k => k !== 'id') as (keyof OmitKey<BonusType, 'id'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const BonusTypePage: React.FC<{ approval?: boolean }> = ({ approval }) => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [bonusType, setBonusType] = useState<BonusType>({
    ...defaultBonusType
  })
  const onBonusTypeChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setBonusType(bonusType => ({ ...bonusType, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setBonusType(bonusType => ({ ...bonusType, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setBonusType(bonusType => ({ ...bonusType, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setBonusType({ ...defaultBonusType })

  const {
    refetch: refetchBonusTypes,
    data: bonusTypes,
    isFetching
  } = useQuery({
    queryKey: ['bonusTypes', ServerSITEMAP.bonusTypes.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allBonusTypes>>(
        ServerSITEMAP.bonusTypes.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: bonusTypeLoading } = useQuery({
    queryKey: ['bonusType', ServerSITEMAP.bonusTypes.getById, bonusType.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof bonusTypeDetails>>(
        ServerSITEMAP.bonusTypes.getById.replace(
          ServerSITEMAP.bonusTypes._params.id,
          bonusType.id.toString()
        )
      ),
    enabled: bonusType.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: bonusType => bonusType && setBonusType(bonusType)
  })

  const { mutate: bonusTypeUpdate, isLoading: bonusTypeUpdateLoading } =
    useMutation({
      mutationKey: ['bonusTypeUpdate', ServerSITEMAP.bonusTypes.put],
      mutationFn: ({
        id,
        bonusType
      }: {
        id: number
        bonusType: Partial<BonusType>
      }) =>
        modifiedFetch<GetResponseType<typeof updateBonusType>>(
          ServerSITEMAP.bonusTypes.put.replace(
            ServerSITEMAP.bonusTypes._params.id,
            id.toString()
          ),
          {
            method: 'put',
            body: JSON.stringify(
              bonusType satisfies GetReqBodyType<typeof updateBonusType>
            )
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        setSidebar(false)
        refetchBonusTypes()
      }
    })

  const { mutate: bonusTypeCreate, isLoading: bonusTypeCreateLoading } =
    useMutation({
      mutationKey: [
        'bonusTypeCreate',
        ServerSITEMAP.bonusTypes.post,
        bonusType
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addBonusType>>(
          ServerSITEMAP.bonusTypes.post,
          { method: 'post', body: JSON.stringify(bonusType) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchBonusTypes()
      }
    })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Bonus Type</strong>
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
        rows={(bonusTypes || [])
          .filter(
            bonusType =>
              (approval
                ? bonusType.status === 'inactive'
                : bonusType.status === 'active') &&
              visibleKeys.find(key =>
                bonusType[key]
                  .toString()
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
          )
          .map(bonusType =>
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
                      bonusTypeUpdate({
                        id: bonusType.id,
                        bonusType: { status: approval ? 'active' : 'inactive' }
                      })
                    }
                  >
                    {bonusType[key]}
                  </span>
                ) : (
                  <>
                    {bonusType[key].substring(0, 50) +
                      (bonusType[key].length > 50 ? '...' : '')}
                  </>
                )
              )
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setBonusType(st => ({ ...st, id: bonusType.id }))
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
          title={`${bonusType.id === -1 ? 'Add' : 'Update'} Bonus Type`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<BonusType, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={bonusTypeLoading}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={bonusType[k]}
                onChange={onBonusTypeChange}
              />
            )
          )}
          {(['status'] satisfies KeysOfObjectOfType<BonusType, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={bonusTypeLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={bonusType[k]}
                options={(
                  ['active', 'inactive'] satisfies BonusType['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {bonusType.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                bonusTypeLoading ||
                bonusTypeCreateLoading ||
                bonusTypeUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                bonusType.id > 0
                  ? bonusTypeUpdate({ id: bonusType.id, bonusType })
                  : bonusTypeCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {bonusType.id > 0 ? 'Update' : 'Add'}
                {(bonusTypeLoading ||
                  bonusTypeCreateLoading ||
                  bonusTypeUpdateLoading) && (
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

export default BonusTypePage
