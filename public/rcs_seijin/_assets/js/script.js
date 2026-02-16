/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/
document.addEventListener('DOMContentLoaded', () => {

  const targets = document.querySelectorAll('.move');

  const observer = new IntersectionObserver((entries, observer) => {
	entries.forEach(entry => {

	  if (entry.isIntersecting) {
		entry.target.classList.add('is-show');
		observer.unobserve(entry.target);
	  }

	});
  }, {
	threshold: 0.2
  });

  targets.forEach(target => observer.observe(target));

});