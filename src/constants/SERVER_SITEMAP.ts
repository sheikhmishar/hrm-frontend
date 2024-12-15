import type * as serverConfig from 'backend/configs'

const root = '/api' as const,
  staticRoot = '/static' as const,
  usersRoot = `${root}/users` as const,
  employeesRoot = `${root}/employees` as const,
  attendancesRoot = `${root}/attendances` as const,
  leavesRoot = `${root}/leaves` as const,
  salariesRoot = `${root}/salaries` as const,
  loansRoot = `${root}/loans` as const,
  holidaysRoot = `${root}/holidays` as const,
  companiesRoot = `${root}/companies` as const,
  departmentsRoot = `${root}/departments` as const,
  monthlySalariesRoot = `${root}/monthly-salaries` as const,
  settingsRoot = `${root}/settings` as const,
  branchesRoot = `${root}/branches` as const,
  dutyTypesRoot = `${root}/duty-types` as const,
  salaryTypesRoot = `${root}/salary-types` as const,
  designationsRoot = `${root}/designations` as const

const rootParams = { id: ':id' } as const

const employeeDocumentDirName =
  'employee_documents' satisfies typeof serverConfig.employeeDocumentDirName
const employeePhotoDirName =
  'employee_photos' satisfies typeof serverConfig.employeePhotoDirName

const ServerSITEMAP = {
  static: {
    _: staticRoot,
    employeeDocuments: `${staticRoot}/${employeeDocumentDirName}`,
    employeePhotos: `${staticRoot}/${employeePhotoDirName}`
  },
  users: {
    _params: rootParams,
    _: usersRoot,
    postRegister: `${usersRoot}/register`,
    postLogin: `${usersRoot}/login`,
    get: usersRoot,
    getSelf: `${usersRoot}/self`,
    getById: `${usersRoot}/:id`,
    put: `${usersRoot}/:id`
  },
  employees: {
    _params: rootParams,
    _: employeesRoot,
    post: employeesRoot,
    get: employeesRoot,
    getAssets: `${employeesRoot}/assets`,
    getById: `${employeesRoot}/:id`,
    put: `${employeesRoot}/:id`
  },
  attendances: {
    _params: { ...rootParams, employeeId: ':employeeId' },
    _queries: {
      from: 'from' as string,
      to: 'to' as string,
      date: 'date' as string
    },
    _: attendancesRoot,
    post: attendancesRoot,
    get: attendancesRoot,
    getCompanyWise: `${attendancesRoot}/companywise`,
    getByEmployeeId: `${attendancesRoot}/:employeeId`,
    put: `${attendancesRoot}/:id`,
    delete: `${attendancesRoot}/:id`
  },
  leaves: {
    _params: { ...rootParams, employeeId: ':employeeId' },
    _queries: { from: 'from' as string, to: 'to' as string },
    _: leavesRoot,
    post: leavesRoot,
    get: leavesRoot,
    getByEmployeeId: `${leavesRoot}/:employeeId`,
    delete: `${leavesRoot}/:id`
  },
  loans: {
    _params: { ...rootParams, employeeId: ':employeeId' },
    _: loansRoot,
    post: loansRoot,
    get: loansRoot,
    getByEmployeeId: `${loansRoot}/:employeeId`,
    delete: `${loansRoot}/:id`
  },
  salaries: {
    _params: { ...rootParams, employeeId: ':employeeId' },
    _: salariesRoot,
    getByEmployeeId: `${salariesRoot}/:employeeId`
  },
  monthlySalaries: {
    _params: { ...rootParams, start_date: ':start_date' },
    _queries: { monthStartDate: 'monthStartDate' as string },
    _: monthlySalariesRoot,
    post: monthlySalariesRoot,
    get: monthlySalariesRoot,
    getAllCompanySalaries: `${monthlySalariesRoot}/companies`,
    getAllByEmployeeId: `${monthlySalariesRoot}/employee/:id`,
    getById: `${monthlySalariesRoot}/:id`,
    put: `${monthlySalariesRoot}/:id`,
    putConfirm: `${monthlySalariesRoot}/confirm/:start_date`,
    delete: `${monthlySalariesRoot}/:start_date`
  },
  holidays: {
    _params: { monthStart: ':monthStart', date: ':date' },
    _: holidaysRoot,
    getByMonthStart: `${holidaysRoot}/:monthStart`,
    post: holidaysRoot,
    delete: `${holidaysRoot}/:date`
  },
  companies: {
    _params: rootParams,
    _: companiesRoot,
    post: companiesRoot,
    get: companiesRoot,
    getById: `${companiesRoot}/:id`,
    put: `${companiesRoot}/:id`
  },
  departments: {
    _params: rootParams,
    _: departmentsRoot,
    post: departmentsRoot,
    get: departmentsRoot,
    getById: `${departmentsRoot}/:id`,
    put: `${departmentsRoot}/:id`
  },
  branches: {
    _params: rootParams,
    _: branchesRoot,
    post: branchesRoot,
    get: branchesRoot,
    getById: `${branchesRoot}/:id`,
    put: `${branchesRoot}/:id`
  },
  dutyTypes: {
    _params: rootParams,
    _: dutyTypesRoot,
    post: dutyTypesRoot,
    get: dutyTypesRoot,
    getById: `${dutyTypesRoot}/:id`,
    put: `${dutyTypesRoot}/:id`
  },
  salaryTypes: {
    _params: rootParams,
    _: salaryTypesRoot,
    post: salaryTypesRoot,
    get: salaryTypesRoot,
    getById: `${salaryTypesRoot}/:id`,
    put: `${salaryTypesRoot}/:id`
  },
  designations: {
    _params: rootParams,
    _: designationsRoot,
    post: designationsRoot,
    get: designationsRoot,
    getById: `${designationsRoot}/:id`,
    put: `${designationsRoot}/:id`
  },
  settings: {
    _params: { property: ':property' },
    _: settingsRoot,
    get: settingsRoot,
    getByProperty: `${settingsRoot}/:property`,
    put: `${settingsRoot}/:property`
  }
} as const
export default ServerSITEMAP
