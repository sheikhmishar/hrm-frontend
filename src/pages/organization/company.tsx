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
import type Company from 'backend/Entities/Company'
import type {
  addCompany,
  allCompanies,
  companyDetails,
  updateCompany
} from 'backend/controllers/companies'

const defaultCompany: Company = {
  id: -1,
  name: '',
  status: 'active'
}

const visibleKeys = (Object.keys(defaultCompany) as (keyof Company)[]).filter(
  k => k !== 'id'
) as (keyof OmitKey<Company, 'id'>)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const CompanyPage: React.FC<{ approval?: boolean }> = ({ approval }) => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)

  const [company, setCompany] = useState<Company>({
    ...defaultCompany
  })
  const onCompanyChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setCompany(company => ({ ...company, [id]: value }))

  const onSelectChange = useCallback<DropDownEventHandler>(
    ({ target: { id, value } }) =>
      setCompany(company => ({ ...company, [id]: value })),
    []
  )

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setCompany(company => ({ ...company, id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const resetData = () => setCompany({ ...defaultCompany })

  const {
    refetch: refetchCompanies,
    data: companies,
    isFetching
  } = useQuery({
    queryKey: ['companies', ServerSITEMAP.companies.get],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof allCompanies>>(
        ServerSITEMAP.companies.get
      ),
    onError: onErrorDisplayToast
  })

  const { isFetching: companyLoading } = useQuery({
    queryKey: ['company', ServerSITEMAP.companies.getById, company.id],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof companyDetails>>(
        ServerSITEMAP.companies.getById.replace(
          ServerSITEMAP.companies._params.id,
          company.id.toString()
        )
      ),
    enabled: company.id > 0,
    onError: onErrorDisplayToast,
    onSuccess: company => company && setCompany(company)
  })

  const { mutate: companyUpdate, isLoading: companyUpdateLoading } =
    useMutation({
      mutationKey: ['companyUpdate', ServerSITEMAP.companies.put],
      mutationFn: ({
        id,
        company
      }: {
        id: number
        company: Partial<Company>
      }) =>
        modifiedFetch<GetResponseType<typeof updateCompany>>(
          ServerSITEMAP.companies.put.replace(
            ServerSITEMAP.companies._params.id,
            id.toString()
          ),
          {
            method: 'put',
            body: JSON.stringify(
              company satisfies GetReqBodyType<typeof updateCompany>
            )
          }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        setSidebar(false)
        refetchCompanies()
      }
    })

  const { mutate: companyCreate, isLoading: companyCreateLoading } =
    useMutation({
      mutationKey: ['companyCreate', ServerSITEMAP.companies.post, company],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof addCompany>>(
          ServerSITEMAP.companies.post,
          { method: 'post', body: JSON.stringify(company) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchCompanies()
      }
    })

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Company</strong>
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
        rows={(companies || [])
          .filter(
            company =>
              (approval
                ? company.status === 'inactive'
                : company.status === 'active') &&
              visibleKeys.find(key =>
                company[key]
                  ?.toString()
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
          )
          .map(company =>
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
                        ? companyUpdate({
                            id: company.id,
                            company: { status: 'active' }
                          })
                        : companyUpdate({
                            id: company.id,
                            company: { status: 'inactive' }
                          })
                    }
                  >
                    {company[key]}
                  </span>
                ) : (
                  <>
                    {company[key]?.substring(0, 50) +
                      (company[key]?.length || 0 > 50 ? '...' : '')}
                  </>
                )
              )
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setCompany(c => ({ ...c, id: company.id }))
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
          title={`${company.id === -1 ? 'Add' : 'Update'} Company`}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['name'] satisfies KeysOfObjectOfType<Company, string>[]).map(k => (
            <Input
              key={k}
              disabled={companyLoading}
              id={k}
              label={capitalizeDelim(k)}
              containerClass='my-3'
              placeholder={'Enter ' + capitalizeDelim(k)}
              value={company[k]}
              onChange={onCompanyChange}
            />
          ))}
          {(['status'] satisfies KeysOfObjectOfType<Company, string>[]).map(
            k => (
              <Select
                key={k}
                id={k}
                disabled={companyLoading}
                autoComplete='true'
                label={capitalizeDelim(k)}
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={company[k]}
                options={(
                  ['active', 'inactive'] satisfies Company['status'][]
                ).map(name => ({ value: name, label: name }))}
                onChange={onSelectChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            {company.id === -1 && (
              <Button className='btn-light mx-2' onClick={resetData}>
                <FaRotateLeft />
              </Button>
            )}
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={
                companyLoading || companyCreateLoading || companyUpdateLoading
              }
              className='btn-primary mx-2'
              onClick={() =>
                company.id > 0
                  ? companyUpdate({ id: company.id, company })
                  : companyCreate()
              }
            >
              <span className='align-items-center d-flex'>
                {company.id > 0 ? 'Update' : 'Add'}
                {(companyLoading ||
                  companyCreateLoading ||
                  companyUpdateLoading) && (
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

export default CompanyPage
