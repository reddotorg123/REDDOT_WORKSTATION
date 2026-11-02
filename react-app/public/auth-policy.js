(function(window) {
  'use strict';

  const rolesByEmail = Object.freeze({
    'jagadish2k2006@gmail.com': 'Founder',
    'reddot.org.123@gmail.com': 'Founder',
    'keerthijai909@gmail.com': 'CEO',
    'pavithratech1206@gmail.com': 'Employee',
    'tejaswinisiva02@gmail.com': 'Employee',
    'mukeshk.webdev@gmail.com': 'Intern',
    'kishoroffical06@gmail.com': 'Intern'
  });

  window.REDDOT_AUTH_POLICY = Object.freeze({
    isApprovedEmail(email) {
      return typeof email === 'string' && Object.hasOwn(rolesByEmail, email.trim().toLowerCase());
    },
    roleForEmail(email) {
      if (typeof email !== 'string') return null;
      return rolesByEmail[email.trim().toLowerCase()] || null;
    }
  });
})(window);
