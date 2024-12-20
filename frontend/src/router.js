import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    name: 'Login',
    path: '/account/login',
    component: () => import('@/pages/Login.vue'),
  },
  {
    path: '/shopping-list',
    name: 'ShoppingList',
    component: () => import('@/pages/ShoppingList.vue'),
  },
];

let router = createRouter({
  history: createWebHistory('/frontend'),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // Check Frappe login status using session cookie
  const isLoggedIn = await checkFrappeSession();

  if (to.name === 'Login' && isLoggedIn) {
    // Redirect logged-in users trying to access login
    next({ name: 'Home' });
  } else if (to.name !== 'Login' && !isLoggedIn) {
    // Redirect unauthenticated users to the Frappe login page
    redirectToFrappeLogin(to.fullPath);
  } else {
    next(); // Proceed as normal
  }
});

// Helper function to check Frappe session status
async function checkFrappeSession() {
  try {
    const response = await fetch('/api/method/frappe.auth.get_logged_user', {
      credentials: 'include', // Ensures session cookie is sent
    });
    if (response.ok) {
      const data = await response.json();
      return !!data.message; // Returns true if a user is logged in
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
  return false; // Default to not logged in
}

// Helper function to redirect to Frappe login
function redirectToFrappeLogin(returnUrl) {
  const loginUrl = `/login?redirect-to=${encodeURIComponent(returnUrl)}`;
  window.location.href = loginUrl;
}

export default router;
