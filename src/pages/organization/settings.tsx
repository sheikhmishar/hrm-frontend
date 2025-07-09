import { useMutation, useQuery } from '@tanstack/react-query'
import { ChangeEventHandler, useContext, useState } from 'react'
import { FaPen } from 'react-icons/fa6'

import Button from '../../components/Button'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import { defaultSetting } from '../../constants/DEFAULT_MODELS'
import ServerSITEMAP from '../../constants/SERVER_SITEMAP'
import { ToastContext } from '../../contexts/toast'
import { capitalize, capitalizeDelim } from '../../libs'
import modifiedFetch from '../../libs/modifiedFetch'
import { SettingContext } from '../../contexts/setting'

import { GetResponseType } from 'backend/@types/response'
import Setting from 'backend/Entities/Setting'
import { settingDetails, updateSetting } from 'backend/controllers/settings'

const visibleKeys = Object.keys(defaultSetting) as (keyof Setting)[]
const columns = visibleKeys.map(capitalize).concat('Action')

const OrganizationSettings = () => {
  const { addToast, onErrorDisplayToast } = useContext(ToastContext)
  const { fetchingSettings, refetchSettings, settings } =
    useContext(SettingContext)

  const [setting, setSetting] = useState<Setting>({ ...defaultSetting })
  const onSettingChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value }
  }) => setSetting(setting => ({ ...setting, [id]: value }))

  const [sidebar, setSidebar] = useState(false)
  const toggleSidebar = () =>
    setSidebar(sidebar => {
      if (sidebar) setSetting(setting => ({ ...setting, _id: -1 }))
      return !sidebar
    })

  const [search, setSearch] = useState('')
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = e =>
    setSearch(e.target.value)

  const { isFetching: settingLoading } = useQuery({
    queryKey: [
      'setting',
      ServerSITEMAP.settings.getByProperty,
      setting.property
    ],
    queryFn: () =>
      modifiedFetch<GetResponseType<typeof settingDetails>>(
        ServerSITEMAP.settings.getByProperty.replace(
          ServerSITEMAP.settings._params.property,
          setting.property
        )
      ),
    enabled: setting.property.length > 0,
    onError: onErrorDisplayToast,
    onSuccess: setting => setting && setSetting(setting)
  })

  const { mutate: settingUpdate, isLoading: settingUpdateLoading } =
    useMutation({
      mutationKey: ['settingUpdate', ServerSITEMAP.settings.put, setting],
      mutationFn: () =>
        modifiedFetch<GetResponseType<typeof updateSetting>>(
          ServerSITEMAP.settings.put.replace(
            ServerSITEMAP.settings._params.property,
            setting.property.toString()
          ),
          { method: 'put', body: JSON.stringify(setting) }
        ),
      onError: onErrorDisplayToast,
      onSuccess: data => {
        data?.message && addToast(data.message)
        toggleSidebar()
        refetchSettings()
      }
    })

  // FIXME: cannot refetch

  return (
    <>
      <div className='mb-4 mt-2 row'>
        <div className='align-items-center d-flex'>
          <div>
            <h4 className='m-0'>
              <strong>Setting</strong>
            </h4>
            <span className='text-primary'>Details</span>
          </div>
          {fetchingSettings && (
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
        </div>
      </div>

      <Table
        columns={columns}
        rows={settings
          .filter(setting =>
            visibleKeys.find(key =>
              setting[key]
                .toString()
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          )
          .map(setting =>
            visibleKeys
              .map(key => (
                <>
                  {setting[key].substring(0, 50) +
                    (setting[key].length > 50 ? '...' : '')}
                </>
              ))
              .concat(
                <Button
                  className='border-0 link-primary text-body'
                  onClick={() => {
                    setSetting(setting)
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
          title={'Update ' + setting.property}
          close={toggleSidebar}
        />
        <Modal.Body>
          {(['value'] satisfies KeysOfObjectOfType<Setting, string>[]).map(
            k => (
              <Input
                key={k}
                disabled={settingLoading}
                id={k}
                label=''
                containerClass='my-3'
                placeholder={'Enter ' + capitalizeDelim(k)}
                value={setting[k]}
                onChange={onSettingChange}
              />
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className='d-flex justify-content-end mt-3'>
            <Button className='btn-light mx-2' onClick={toggleSidebar}>
              Cancel
            </Button>
            <Button
              disabled={fetchingSettings || settingUpdateLoading}
              className='btn-primary mx-2'
              onClick={() => settingUpdate()}
            >
              <span className='align-items-center d-flex'>
                Update
                {(fetchingSettings || settingUpdateLoading) && (
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

export default OrganizationSettings
