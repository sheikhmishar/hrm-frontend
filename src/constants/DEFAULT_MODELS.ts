import { dateToString } from '../libs'

import Branch from 'backend/Entities/Branch'
import Company from 'backend/Entities/Company'
import Department from 'backend/Entities/Department'
import Designation from 'backend/Entities/Designation'
import DutyType from 'backend/Entities/DutyType'
import Employee from 'backend/Entities/Employee'
import EmployeeAsset from 'backend/Entities/EmployeeAsset'
import EmployeeAttendance from 'backend/Entities/EmployeeAttendance'
import EmployeeContact from 'backend/Entities/EmployeeContacts'
import EmployeeDocument from 'backend/Entities/EmployeeDocument'
import EmployeeFinancial from 'backend/Entities/EmployeeFinancial'
import EmployeeLeave from 'backend/Entities/EmployeeLeave'
import Loan from 'backend/Entities/Loan'
import MonthlySalary from 'backend/Entities/MonthlySalary'
import SalaryType from 'backend/Entities/SalaryType'
import Setting from 'backend/Entities/Setting'
import User from 'backend/Entities/User'

export const defaultDepartment: Department = {
  id: -1,
  name: '',
  status: 'active'
}
export const defaultBranch: Branch = { ...defaultDepartment }
export const defaultDesignation: Designation = { ...defaultDepartment }
export const defaultDutyType: DutyType = { ...defaultDepartment }
export const defaultSalaryType: SalaryType = { ...defaultDepartment }
export const defaultCompany: Company = {
  ...defaultDepartment,
  logo: '',
  status: 'active'
}

export const defaultEmployee: Employee = {
  id: -1,
  photo: '',
  name: '',
  phoneNumber: '',
  altPhoneNumber: '',
  email: '',
  dateOfBirth: '',
  fullAddress: '',
  gender: 'Male',
  company: defaultCompany,
  department: defaultDepartment,
  branch: defaultBranch,
  designation: defaultDesignation,
  dutyType: defaultDutyType,
  salaryType: defaultSalaryType,
  dateOfJoining: dateToString(new Date()),
  basicSalary: 0,
  conveyance: 0,
  foodCost: 0,
  houseRent: 0,
  medicalCost: 0,
  totalSalary: 0,
  loanRemaining: 0,
  loanTaken: 0,
  taskWisePayment: undefined,
  wordLimit: undefined,
  officeStartTime: '12:00',
  officeEndTime: '16:00',
  checkedInLateFee: 'inApplicable',
  overtime: 'inApplicable',
  noticePeriod: undefined,
  noticePeriodRemark: undefined,
  extraBonus: 'inApplicable',
  status: 'active',
  createdDate: new Date(),
  assets: [],
  contacts: [],
  documents: [],
  financials: [],
  attendances: [],
  leaves: [],
  salaries: [],
  loans: []
}

export const defaultFinancial: EmployeeFinancial = {
  id: -1,
  accountNumber: '',
  bankName: '',
  branch: '',
  holderName: '',
  medium: '',
  employee: defaultEmployee
}
export const defaultDocument: EmployeeDocument = {
  id: -1,
  name: '',
  path: 'blob:',
  employee: defaultEmployee
}

export const defaultContact: EmployeeContact = {
  id: -1,
  name: '',
  phoneNo: '',
  relation: '',
  employee: defaultEmployee
}

export const defaultAsset: EmployeeAsset = {
  id: -1,
  name: '',
  description: '',
  givenDate: '',
  returnDate: undefined,
  employee: defaultEmployee
}

export const defaultSetting: Setting = {
  property: '',
  value: ''
}

export const defaultLeave: EmployeeLeave = {
  id: -1,
  from: '',
  to: '',
  totalDays: 0,
  duration: 'fullday',
  reason: '',
  status: 'approved',
  type: 'paid',
  employee: defaultEmployee
}

export const defaultLoan: Loan = {
  id: -1,
  amount: 0,
  date: dateToString(new Date()),
  employee: defaultEmployee
}

export const defaultAttendance: EmployeeAttendance = {
  id: -1,
  arrivalTime: '',
  date: '',
  leaveTime: '',
  late: 0,
  overtime: 0,
  totalTime: 0,
  employee: defaultEmployee
}

export const defaultMonthlySalary: MonthlySalary = {
  id: -1,
  basicSalary: 0,
  bonus: 0,
  leaveEncashment: 0,
  conveyance: 0,
  foodCost: 0,
  houseRent: 0,
  late: 0,
  lateDeduction: 0,
  leave: 0,
  leaveDeduction: 0,
  medicalCost: 0,
  monthStartDate: '2011-01-01',
  overtime: 0,
  overtimePayment: 0,
  paymentMethod: '',
  penalty: 0,
  status: 'Unpaid',
  loanDeduction: 0,
  totalSalary: 0,
  paidAt: new Date(),
  employee: defaultEmployee
}

export const defaultUser: User = {
  id: -1,
  name: '',
  email: '',
  password: '',
  phoneNumber: '',
  status: 'inactive',
  type: 'HR'
}
