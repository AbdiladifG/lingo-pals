const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
      const mobileMenu = document.querySelector('.mobile-menu');

      mobileMenuBtn.addEventListener('click', () => {
          mobileMenu.classList.toggle('active');
      });

      // Close menu when clicking a link
      document.querySelectorAll('.mobile-nav-links a').forEach(link => {
          link.addEventListener('click', () => {
              mobileMenu.classList.remove('active');
          });
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
          if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
              mobileMenu.classList.remove('active');
          }
      });