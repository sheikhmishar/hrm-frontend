const root = '',
  organizationRoot = `${root}/organization`,
  employeeRoot = `${root}/employee`,
  attendanceRoot = `${root}/attendance`,
  leaveRoot = `${root}/leave`,
  payrollRoot = `${root}/payroll`,
  approvalRoot = `${root}/approval`

export const ROUTE_PARAMS = { id: ':id' }
export const LOGIN_ROUTE_QUERY = { prev: 'prev' }

export const ROUTES = {
  root: `${root}/`,
  register: `${root}/register`,
  login: `${root}/login`,
  password: `${root}/password`,
  awaitingApproval: `${root}/awaiting-approval`,
  dashboard: `${root}/dashboard`,
  user: `${root}/user`,
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
    timesheet: `${attendanceRoot}/timesheet`,
    monthly: `${attendanceRoot}/monthly`,
    details: `${attendanceRoot}/monthly/:id`,
    import: `${attendanceRoot}/import`,
    holiday: `${attendanceRoot}/holiday`
  },
  leave: {
    _: leaveRoot,
    _params: ROUTE_PARAMS,
    _queries: { month: 'month' },
    assigned: `${leaveRoot}/assigned`,
    details: `${leaveRoot}/calender/:id`,
    calender: `${leaveRoot}/calender`
  },
  payroll: {
    _: payrollRoot,
    _params: ROUTE_PARAMS,
    id: `${payrollRoot}/:id`,
    loan: `${payrollRoot}/loan`,
    loanById: `${payrollRoot}/loan/:id`,
    monthly: `${payrollRoot}/monthly`,
    cost: `${payrollRoot}/cost`,
    update: `${payrollRoot}/update`,
    updateById: `${payrollRoot}/update/:id`
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
  },
  approval: {
    _: approvalRoot,
    company: `${approvalRoot}/company`,
    department: `${approvalRoot}/department`,
    branch: `${approvalRoot}/branch`,
    dutyType: `${approvalRoot}/duty-type`,
    salaryType: `${approvalRoot}/salary-type`,
    designation: `${approvalRoot}/designation`,
    employee: `${approvalRoot}/employee`
  },
  report: `${root}/report`
}

export const BLANK_ARRAY = [] as never[]
