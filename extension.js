document.addEventListener('DOMContentLoaded', function() {
  const tabLinks = document.querySelectorAll('.tabLink');
  const tabContents = document.querySelectorAll('.tabContent');

  tabLinks.forEach(link => {
    link.addEventListener('click', function() {
      tabLinks.forEach(link => link.classList.remove('active'));
      tabContents.forEach(content => content.style.display = 'none');

      this.classList.add('active');
      document.getElementById(this.id.replace('Tab', 'Content')).style.display = 'block';
    });
  });
});
