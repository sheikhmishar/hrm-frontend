// import { Satisfies } from '../libs'

const root = '',
  organizationRoot = `${root}/organization`,
  employeeRoot = `${root}/employee`,
  attendanceRoot = `${root}/attendance`,
  leaveRoot = `${root}/leave`,
  payrollRoot = `${root}/payroll`

export const ROUTE_PARAMS = { id: ':id' }
export const LOGIN_ROUTE_QUERY = { prev: 'prev' }

export const ROUTES = {
  root: `${root}/`,
  register: `${root}/register`,
  login: `${root}/login`,
  password: `${root}/password`,
  dashboard: `${root}/dashboard`,
  employee: {
    _: employeeRoot,
    _params: ROUTE_PARAMS,
    list: `${employeeRoot}/list`,
    details: `${employeeRoot}/details/:id`,
    assets: `${employeeRoot}/assets`,
    notices: `${employeeRoot}/notices`
  },
  attendance: {
    _: attendanceRoot,
    _params: ROUTE_PARAMS,
    _queries: { month: 'month' },
    history: `${attendanceRoot}/history`,
    monthly: `${attendanceRoot}/monthly`,
    details: `${attendanceRoot}/details/:id`,
    import: `${attendanceRoot}/import`
  },
  leave: {
    _: leaveRoot,
    _params: ROUTE_PARAMS,
    _queries: { month: 'month' },
    assigned: `${leaveRoot}/assigned/`,
    details: `${leaveRoot}/details/:id`,
    calender: `${leaveRoot}/calender`
  },
  payroll: {
    _: payrollRoot,
    _params: ROUTE_PARAMS,
    id: `${payrollRoot}/:id`,
    monthly: `${payrollRoot}/monthly`,
    update: `${payrollRoot}/update`
  },
  organization: {
    _: organizationRoot,
    company: `${organizationRoot}/company`,
    department: `${organizationRoot}/department`,
    branch: `${organizationRoot}/branch`,
    dutyType: `${organizationRoot}/duty-type`,
    salaryType: `${organizationRoot}/salary-type`,
    designation: `${organizationRoot}/designation`,
    settings: `${organizationRoot}/settings`
  }
}

// export const STAKEHOLDER_CLIENT_QUERY = `${
//   ROUTES.transaction._query.type
// }=${Satisfies<Stakeholder['type']>('CLIENT')}`

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
].map(m => m.slice(0, 3))

export const isLeapYear = (y: number) => (!(y % 4) && y % 100) || !(y % 400)

export const getMonthDays = (monthIdx: number, year: number) =>
  monthIdx === 1
    ? isLeapYear(year)
      ? 29
      : 28
    : [8, 3, 5, 10].includes(monthIdx)
    ? 30
    : 31

export const BLANK_ARRAY = [] as never[]
