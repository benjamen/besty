import router from '@/router';
import { computed, reactive } from 'vue';
import { createResource } from 'frappe-ui';

import { userResource } from './user';

export function sessionUser() {
  const cookies = new URLSearchParams(document.cookie.split('; ').join('&'));
  let _sessionUser = cookies.get('user_id');
  if (_sessionUser === 'Guest') {
    _sessionUser = null;
  }
  return _sessionUser;
}

export const session = reactive({
  login: createResource({
    url: 'login',
    makeParams({ email, password }) {
      return {
        usr: email,
        pwd: password,
      };
    },
    onSuccess(data) {
      userResource.reload();
      session.user = sessionUser();
      session.login.reset();

      // Force redirect to the Vue landing page
      router.replace('/');
    },
  }),
  logout: createResource({
    url: 'logout',
    onSuccess() {
      userResource.reset();
      session.user = sessionUser();

      // Redirect to the front-end landing page after logout
      router.replace({ name: 'Home' });

      // Force a page refresh to clear any residual state
      setTimeout(() => {
        window.location.reload();
      }, 100); // Small delay ensures the router navigation completes
    },
  }),
  user: sessionUser(),
  isLoggedIn: computed(() => !!session.user),
});
