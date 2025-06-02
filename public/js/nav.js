document.addEventListener('DOMContentLoaded', () => {
      const nav = document.getElementById('nav-link');

      async function updateNav() {
        try {
          const res = await fetch('/api/auth/me');
          const { user } = await res.json();
          console.log(user)
          if (user) {
            nav.innerHTML = `
                <span class="nav-welcome">Hello, ${user.email}</span>
                <a href="/new-job.html" class="nav-link btn-primary">Post a Job</a>
                <a href="/profile_edit.html" class="nav-link">Account</a>
                <a href="#" id="logout-link" class="nav-link">Logout</a>
            `;

            document
                .getElementById('logout-link')
                .addEventListener('click', async e => {
                e.preventDefault();
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.reload();
                });
            } else {
            // not logged in
            nav.innerHTML = `
              <a href="/signin.html" class="nav-link">Sign In</a>
              <a href="/register.html" class="nav-link btn-secondary">Register</a>
            `;
          }
        } catch (err) {
          console.error('Error fetching auth status', err);
        }
      }

      updateNav();
    });