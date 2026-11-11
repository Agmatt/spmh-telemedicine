export const nav = {
  primary: [
    { href: '/', label: 'Home' },
    { href: '/specialties', label: 'Specialties' },
    { href: '/doctors', label: 'Doctors' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/faq', label: 'FAQ' },
  ],
};

export const roleHome: Record<string, string> = {
  patient: '/portal',
  doctor: '/doctor',
  receptionist: '/admin/bookings',
  admin: '/admin',
  supervisor: '/admin',
};
