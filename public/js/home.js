// Service Slider

$(document).ready(function() {
  $('.destianation-all').owlCarousel({
    items: 3,
    loop: true,
    autoplay: true, 
    autoplayTimeout: 3000, 
    nav: false,
    autoplayHoverPause: true,
    margin:30,
    responsive: {
      0: {
        items: 1
      },
      480: {
        items: 2
      },
      768: {
        items: 1
      },
      992: {
        items: 3
      }
    }
  });

  $('.custom-nav .prev').click(function() {
    $('.owl-carousel').trigger('prev.owl.carousel');
  });

  $('.custom-nav .next').click(function() {
    $('.owl-carousel').trigger('next.owl.carousel');
  });
});

$(document).ready(function() {
  $('.owl-carousel').owlCarousel({
    items: 3,
    loop: true,
    autoplay: true, 
    autoplayTimeout: 3000, 
    autoplayHoverPause: true,
    nav: false,
    margin:30,
    responsive: {
      0: {
        items: 1
      },
      480: {
        items: 2
      },
      768: {
        items: 1
      },
      992: {
        items: 3.5
      }
    }
  });

  $('.custom-nav .prev').click(function() {
    $('.owl-carousel').trigger('prev.owl.carousel');
  });

  $('.custom-nav .next').click(function() {
    $('.owl-carousel').trigger('next.owl.carousel');
  });
});


document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const answer = button.nextElementSibling;
    const isVisible = answer.style.display === 'block';

    // Collapse all answers
    document.querySelectorAll('.faq-answer').forEach(ans => (ans.style.display = 'none'));

    // Toggle current answer
    answer.style.display = isVisible ? 'none' : 'block';

    // Update the '+' sign
    document.querySelectorAll('.faq-question span').forEach(span => (span.textContent = '+'));
    button.querySelector('span').textContent = isVisible ? '+' : '-';
  });
});

