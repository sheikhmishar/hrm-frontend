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
  user: `${organizationRoot}/user`,
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
    details: `${attendanceRoot}/monthly/:id`,
    import: `${attendanceRoot}/import`,
    holiday: `${attendanceRoot}/holiday`
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
    loan: `${payrollRoot}/loan`,
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

export const BLANK_ARRAY = [] as never[]
