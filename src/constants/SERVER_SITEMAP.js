const root = '/api',
  staticRoot = '/static',
  usersRoot = `${root}/users`,
  employeesRoot = `${root}/employees`,
  companiesRoot = `${root}/companies`,
  departmentsRoot = `${root}/departments`,
  branchesRoot = `${root}/branches`,
  dutyTypesRoot = `${root}/duty-types`,
  salaryTypesRoot = `${root}/salary-types`,
  designationsRoot = `${root}/designations`

const rootParams = { id: ':id' }

const employeeDocumentDirName = 'employee_documents'

const ServerSITEMAP = {
  static: {
    _: staticRoot,
    employeeDocuments: `${staticRoot}/${employeeDocumentDirName}`
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
    postBulk: `${employeesRoot}/bulk`,
    get: employeesRoot,
    getById: `${employeesRoot}/:id`,
    getSalaryById: `${employeesRoot}/salaries/:id`,
    put: `${employeesRoot}/:id`
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
  }
}

export default ServerSITEMAP
