import type { MouseEventHandler } from 'react'
import React, { useEffect, useRef, useState } from 'react'

import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6'

import FloatingSelect from './FloatingSelect'

const ITEMS_PER_PAGE = new Array<number>(5)
  .fill(0)
  .map((_, i) => (i + 1) * 5) as unknown as readonly [
  number,
  number,
  number,
  number,
  number
]

function paginate(lastIdx: number, size: number) {
  const pages: [number, number][] = []
  for (let i = 0; i <= lastIdx; i += size)
    pages.push([i, Math.min(i + size - 1, lastIdx)])
  return pages
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => i + start)

const SIBLING_COUNT = 2
// SIDE_PAGE_COUNT is determined as SIBLING_COUNT + firstPage + lastPage + currentPage + 2*DOTS
const MAX_PAGE_COUNT = SIBLING_COUNT + 5
// Show left dot: first + dot + [(sibling) + current + (sibling) + last]
// Show right dot: [first + (sibling) + current + (sibling)] + dot + last
const SIDE_PAGE_COUNT = 2 + 2 * SIBLING_COUNT
const FIRST_PAGE_INDEX = 0
const DOTS = -1

function usePagination(totalElements: number, elementsPerPage: number) {
  const pageCount = Math.ceil(totalElements / elementsPerPage)
  const lastPageIndex = pageCount - 1
  const elementIndexRanges = paginate(totalElements - 1, elementsPerPage)

  const [pageIndex, setPageIndex] = useState(0)
  let pageIndices: number[] = range(0, pageCount - 1)

  if (pageCount > MAX_PAGE_COUNT) {
    const leftMostSiblingIndex = Math.max(pageIndex - SIBLING_COUNT, 0)
    const rightMostSiblingIndex = Math.min(
      pageIndex + SIBLING_COUNT,
      lastPageIndex
    )

    const shouldShowLeftDots = leftMostSiblingIndex > FIRST_PAGE_INDEX + 2
    const shouldShowRightDots = rightMostSiblingIndex < lastPageIndex - 2

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const pageIndicesBeforeDot = range(FIRST_PAGE_INDEX, SIDE_PAGE_COUNT)
      pageIndices = [...pageIndicesBeforeDot, DOTS, lastPageIndex]
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      const pageIndicesAfterDot = range(
        lastPageIndex - SIDE_PAGE_COUNT,
        lastPageIndex
      )
      pageIndices = [FIRST_PAGE_INDEX, DOTS, ...pageIndicesAfterDot]
    } else
      pageIndices = [
        FIRST_PAGE_INDEX,
        DOTS,
        ...range(leftMostSiblingIndex, rightMostSiblingIndex),
        DOTS,
        lastPageIndex
      ]
  }

  const elementIndexRange = elementIndexRanges[
    Math.min(pageIndex, pageCount - 1)
  ] || [0, 0]

  useEffect(
    () => setPageIndex(pIdx => Math.max(Math.min(pIdx, pageCount - 1), 0)),
    [pageCount]
  )

  return { pageCount, pageIndex, elementIndexRange, setPageIndex, pageIndices }
}

type TableD = Omit<JSX.IntrinsicElements['table'], 'className'> & {
  columns: string[]
  rows: JSX.Element[][]
  contCls?: string
}

const Table: React.FC<TableD> = ({ columns, rows, contCls, ...props }) => {
  const paginationRef = useRef<HTMLDivElement>(null)
  const pageNumberInputRef = useRef<HTMLInputElement>(null)

  const [isInput, setIsInput] = useState(false)
  const [elementsPerPage, setElementsPerPage] = useState(ITEMS_PER_PAGE[0]!)
  const { pageCount, pageIndex, elementIndexRange, setPageIndex, pageIndices } =
    usePagination(rows.length, elementsPerPage)

  const toggleIsInput = () => setIsInput(isInput => !isInput)

  const currentRows = rows.filter(
    (_, i) =>
      elementIndexRange &&
      i >= elementIndexRange[0] &&
      i <= elementIndexRange[1]
  )

  const onPageIndexClick: MouseEventHandler<HTMLButtonElement> = e =>
    setPageIndex(parseInt(e.currentTarget.id.replace('page_', '')))

  useEffect(
    () =>
      paginationRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      }),
    [pageCount, pageIndex]
  )

  if (!rows.length) return <div className='bg-body p-3 rounded'>No Data</div>

  return (
    <>
      <div
        className={contCls || 'bg-body p-3 rounded shadow-sm table-responsive'}
      >
        <table className='table table-hover' {...props}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} scope='col' className='align-middle text-nowrap'>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((col, i) =>
                  i ? (
                    <td className='align-middle' key={i}>
                      {col}
                    </td>
                  ) : (
                    <th key={i} scope='col' className='align-middle'>
                      {col}
                    </th>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > ITEMS_PER_PAGE[0] && (
        <div className='mt-3 row'>
          <div className='col-12 col-md-3'>
            <FloatingSelect
              id='itemsPerPage'
              value={elementsPerPage}
              onChange={e => setElementsPerPage(parseInt(e.target.value) || 5)}
              label='Items per page'
              options={ITEMS_PER_PAGE.map(value => ({
                label: value.toString(),
                value
              }))}
            />
          </div>
          <div
            className='align-items-center col-12 col-md-9 d-flex justify-content-end'
            ref={paginationRef}
          >
            <nav aria-label='Table Navigation'>
              <ul className='flex-wrap my-3 pagination rounded shadow-sm'>
                <li
                  className={`page-item ${pageIndex === 0 ? 'disabled' : ''}`}
                >
                  <button
                    className='page-link user-select-none'
                    tabIndex={-1}
                    aria-disabled={pageIndex === 0}
                    id={`page_${pageIndex - 1}`}
                    onClick={onPageIndexClick}
                  >
                    <FaAngleLeft />
                  </button>
                </li>
                {pageIndices.map((pIdx, i) => (
                  <li
                    key={`${pIdx}${i}`}
                    className={`page-item position-relative ${
                      pageIndex === pIdx ? 'active' : ''
                    }`}
                  >
                    <button
                      disabled={pIdx === DOTS}
                      className='page-link user-select-none'
                      id={`page_${pIdx}`}
                      onClick={
                        pageIndex === pIdx ? toggleIsInput : onPageIndexClick
                      }
                    >
                      {pIdx === DOTS ? '...' : pIdx + 1}
                    </button>
                    {pageIndex === pIdx && isInput && (
                      <div
                        className='bottom-100 d-flex mb-1 position-absolute start-50 translate-middle-x'
                        style={{ width: '300%' }}
                      >
                        <input
                          ref={pageNumberInputRef}
                          className='form-control form-control-sm rounded-end-0 shadow-sm'
                          defaultValue={pageIndex + 1}
                          type='number'
                        />
                        <button
                          className='btn btn-primary rounded-start-0 shadow-sm'
                          onClick={() =>
                            setPageIndex(pageIndex => {
                              const typedPageNumber =
                                pageNumberInputRef.current?.valueAsNumber
                              return typeof typedPageNumber !== 'undefined' &&
                                typedPageNumber > 0 &&
                                typedPageNumber <= pageCount
                                ? typedPageNumber - 1
                                : pageIndex
                            })
                          }
                        >
                          <FaAngleRight />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
                <li
                  className={`page-item ${
                    pageIndex === pageCount - 1 ? 'disabled' : ''
                  }`}
                >
                  <button
                    className='page-link user-select-none'
                    aria-disabled={pageIndex === pageCount - 1}
                    id={`page_${pageIndex + 1}`}
                    onClick={onPageIndexClick}
                  >
                    <FaAngleRight />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

export default Table
