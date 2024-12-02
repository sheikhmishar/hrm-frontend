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
import type Designation from 'backend/Entities/Designation'
import type {
  addDesignation,
  allDesignations,
  designationDetails,
  updateDesignation
} from 'backend/controllers/designations'

const defaultDesignation: Designation = {
  id: -1,
  name: '',
  status: 'active'
}

const visibleKeys = (
  Object.keys(defaultDesignation) as (keyof Designation)[]
).filter(k => k !== 'id') as (keyof OmitKey<Designation, 'id'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const DesignationPage: React.FC<{ approval?: boolean }> = ({ approval }) => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [designation, setDesignation] = useState<Designation>({
    ...defaultDesignation
  })
  const onDesignationChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setDesignation(designation => ({ ...designation, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setDesignation(designation => ({ ...designation, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setDesignation(designation => ({ ...designation, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setDesignation({ ...defaultDesignation })

  const {
    refetch: refetchDesignations,
    data: designations,
    isFetching
  } = useQuery({
    queryKey: ['designations', ServerSITEMAP.designations.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allDesignations>>(
        ServerSITEMAP.designations.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: designationLoading } = useQuery({
    queryKey: [
      'designation',
      ServerSITEMAP.designations.getById,
      designation.id
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof designationDetails>>(
        ServerSITEMAP.designations.getById.replace(
          ServerSITEMAP.designations._params.id,
          designation.id.toString()
        )
      ),
    enabled: designation.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: designation => designation && setDesignation(designation)
  })

  const { mutate: designationUpdate, isLoading: designationUpdateLoading } =
    useMutation({
      mutationKey: ['designationUpdate', ServerSITEMAP.designations.put],
      mutationFn: ({
        id,
        designation
      }: {
        id: number
        designation: Partial<Designation>
      }) =>
        modifiedFetch<GetResponseType<typeof updateDesignation>>(
          ServerSITEMAP.designations.put.replace(
            ServerSITEMAP.designations._params.id,
            id.toString()
          ),
          {
            method: 'put',
            body: JSON.stringify(
              designation satisfies GetReqBodyType<typeof updateDesignation>
            )
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        setSidebar(false)
        refetchDesignations()
      }
    })

  const { mutate: designationCreate, isLoading: designationCreateLoading } =
    useMutation({
      mutationKey: [
        'designationCreate',
        ServerSITEMAP.designations.post,
        designation
      ],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addDesignation>>(
          ServerSITEMAP.designations.post,
          { method: 'post', body: JSON.stringify(designation) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchDesignations()
      }
    })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Designation</strong>
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
        rows={(designations || [])
          .filter(
            designation =>
              (approval
                ? designation.status === 'inactive'
                : designation.status === 'active') &&
              visibleKeys.find(key =>
                designation[key]
                  .toString()
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
          )
          .map(designation =>
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
                      designationUpdate({
                        id: designation.id,
                        designation: {
                          status: approval ? 'active' : 'inactive'
                        }
                      })
                    }
                  >
                    {designation[key]}
                  </span>
                ) : (
                  <>
                    {designation[key].substring(0, 50) +
                      (designation[key].length > 50 ? '...' : '')}
                  </>
                )
              )
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setDesignation(d => ({ ...d, id: designation.id }))
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
          title={`${designation.id === -1 ? 'Add' : 'Update'} Designation`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<Designation, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={designationLoading}
                id={k}
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={designation[k]}
                onChange={onDesignationChange}
              />
            )
          )}
          {(['status'] satisfies KeysOfObjectOfType<Designation, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={designationLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={designation[k]}
                options={(
                  ['active', 'inactive'] satisfies Designation['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {designation.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                designationLoading ||
                designationCreateLoading ||
                designationUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                designation.id > 0
                  ? designationUpdate({ id: designation.id, designation })
                  : designationCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {designation.id > 0 ? 'Update' : 'Add'}
                {(designationLoading ||
                  designationCreateLoading ||
                  designationUpdateLoading) && (
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

export default DesignationPage
