import 'backend/@types'
import 'react'
import type { Dispatch, SetStateAction } from 'react'

declare global {
  interface ImportMetaEnv {
    readonly REACT_APP_BASE_URL?: string
  }
  namespace React {
    interface HTMLAttributes {
      page_id?: string
      attribution?: string
    }
  }
  declare function clearTimeout(timeoutId: NodeJS.Timeout | undefined): void
  type SetState<T> = Dispatch<SetStateAction<T>>

  type OmitKey<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

  type KeysOfObjectOfType<T, TCondition> = {
    [K in keyof T]: T[K] extends TCondition ? K : never
  }[keyof T]
}
