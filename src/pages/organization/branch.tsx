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
import type Branch from 'backend/Entities/Branch'
import type {
  addBranch,
  allBranches,
  branchDetails,
  updateBranch
} from 'backend/controllers/branches'

const defaultBranch: Branch = {
  id: -1,
  name: '',
  status: 'active'
}

const visibleKeys = (Object.keys(defaultBranch) as (keyof Branch)[]).filter(
  k => k !== 'id'
) as (keyof OmitKey<Branch, 'id'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const BranchPage: React.FC<{ approval?: boolean }> = ({ approval }) => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [branch, setBranch] = useState<Branch>({
    ...defaultBranch
  })
  const onBranchChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setBranch(branch => ({ ...branch, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setBranch(branch => ({ ...branch, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setBranch(branch => ({ ...branch, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setBranch({ ...defaultBranch })

  const {
    refetch: refetchBranches,
    data: branches,
    isFetching
  } = useQuery({
    queryKey: ['branches', ServerSITEMAP.branches.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allBranches>>(
        ServerSITEMAP.branches.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: branchLoading } = useQuery({
    queryKey: ['branch', ServerSITEMAP.branches.getById, branch.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof branchDetails>>(
        ServerSITEMAP.branches.getById.replace(
          ServerSITEMAP.branches._params.id,
          branch.id.toString()
        )
      ),
    enabled: branch.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: branch => branch && setBranch(branch)
  })

  const { mutate: branchUpdate, isLoading: branchUpdateLoading } = useMutation({
    mutationKey: ['branchUpdate', ServerSITEMAP.branches.put],
    mutationFn: ({ id, branch }: { id: number; branch: Partial<Branch> }) =>
      modifiedFetch<GetResponseType<typeof updateBranch>>(
        ServerSITEMAP.branches.put.replace(
          ServerSITEMAP.branches._params.id,
          id.toString()
        ),
        {
          method: 'put',
          body: JSON.stringify(
            branch satisfies GetReqBodyType<typeof updateBranch>
          )
        }
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      data?.message && addToast(data.message)
      setSidebar(false)
      refetchBranches()
    }
  })

  const { mutate: branchCreate, isLoading: branchCreateLoading } = useMutation({
    mutationKey: ['branchCreate', ServerSITEMAP.branches.post, branch],
    mutationFn: () =>
      modifiedFetch<GetResponseType<typeof addBranch>>(
        ServerSITEMAP.branches.post,
        { method: 'post', body: JSON.stringify(branch) }
      ),
    onError: onErrorDisplayToast,
    onSuccess: data => {
      data?.message && addToast(data.message)
      toggleSidebar()
      refetchBranches()
    }
  })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Branch</strong>
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
        rows={(branches || [])
          .filter(branch =>
            visibleKeys.find(
              key =>
                (approval
                  ? branch.status === 'inactive'
                  : branch.status === 'active') &&
                branch[key]
                  .toString()
                  .toLowerCase()
                  .includes(search.toLowerCase())
            )
          )
          .map(branch =>
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
                      approval
                        ? branchUpdate({
                            id: branch.id,
                            branch: { status: 'active' }
                          })
                        : branchUpdate({
                            id: branch.id,
                            branch: { status: 'inactive' }
                          })
                    }
                  >
                    {branch[key]}
                  </span>
                ) : (
                  <>
                    {branch[key].substring(0, 50) +
                      (branch[key].length > 50 ? '...' : '')}
                  </>
                )
              )
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setBranch(b => ({ ...b, id: branch.id }))
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
          title={`${branch.id === -1 ? 'Add' : 'Update'} Branch`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<Branch, string>[]).map(k => (
            <Input
              key={k}
              disabled={branchLoading}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={branch[k]}
              onChange={onBranchChange}
            />
          ))}
          {(['status'] satisfies KeysOfObjectOfType<Branch, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={branchLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={branch[k]}
                options={(
                  ['active', 'inactive'] satisfies Branch['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {branch.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                branchLoading || branchCreateLoading || branchUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                branch.id > 0
                  ? branchUpdate({ id: branch.id, branch })
                  : branchCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {branch.id > 0 ? 'Update' : 'Add'}
                {(branchLoading ||
                  branchCreateLoading ||
                  branchUpdateLoading) && (
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

export default BranchPage
