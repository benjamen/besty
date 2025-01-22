import axios from 'axios';
import router from '@/router';
import { computed, reactive, onMounted } from 'vue';
import { createResource } from 'frappe-ui';
import { userResource } from './user';

// Function to get CSRF token
const getCsrfToken = () => {
  const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
  return csrfTokenMeta ? csrfTokenMeta.getAttribute('content') : '';
};

// Function to get the session user for frontend
export function sessionUserFrontend() {
  const cookies = new URLSearchParams(document.cookie.split('; ').join('&'));
  let _sessionUser = cookies.get('frontend_user_id');
  if (_sessionUser === 'Guest') {
    _sessionUser = null;
  }
  return _sessionUser;
}

// Reactive session object
export const session = reactive({
  login: createResource({
    url: 'login',
    makeParams({ email, password }) {
      return {
        usr: email,
        pwd: password,
        csrf_token: getCsrfToken(), // Include CSRF token
      };
    },
    onSuccess(data) {
      userResource.reload();
      session.user = sessionUserFrontend();
      session.login.reset();

      // Force redirect to the frontend landing page
      router.replace('/frontend');
    },
  }),
  logout: createResource({
    url: 'logout',
    headers: {
      'X-CSRF-Token': getCsrfToken(), // Include CSRF token
    },
    onSuccess() {
      userResource.reset();
      session.user = sessionUserFrontend();

      // Redirect to the frontend landing page after logout
      router.replace({ name: 'Home' });

      // Force a page refresh to clear any residual state
      setTimeout(() => {
        window.location.reload();
      }, 100); // Small delay ensures the router navigation completes
    },
  }),
  user: sessionUserFrontend(),
  isLoggedIn: computed(() => !!session.user),
});

// Verify user login on component mount
onMounted(() => {
  if (!session.isLoggedIn) {
    router.replace('/login');
  } else {
    // Ensure CSRF token is included in the headers of your API requests
    axios.defaults.headers.common['X-CSRF-Token'] = getCsrfToken();
  }
});
