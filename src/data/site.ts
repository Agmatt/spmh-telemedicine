export const site = {
  name: 'SPMH Telemedicine',
  shortName: 'SPMH',
  url: 'https://telemedicine.spmh.co.ke',
  hospital: "St. Paul's Mission Hospital, Homa Bay",
  description:
    "Secure online consultations with SPMH doctors — part of the hospital's digital health transformation.",
  contact: {
    phone: '+254111817447',
    email: 'telemedicine@spmh.co.ke',
    hours: 'Mon–Sat, 8:00 AM – 5:00 PM',
  },
  legal: {
    privacy: '/legal/privacy',
    terms: '/legal/terms',
    dpa: '/legal/dpa',
    version: '1.0',
  },
  paths: {
    login: '/auth/login',
    register: '/auth/register',
    dashboard: '/dashboard',
    patientPortal: '/portal',
    doctorConsole: '/doctor',
    adminConsole: '/admin',
  },
} as const;
