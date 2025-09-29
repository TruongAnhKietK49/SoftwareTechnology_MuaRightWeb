fetch("/template/includes/header.html")
      .then(response => response.text())
      .then(data => {
        document.getElementById("header-container").innerHTML = data;
      });

fetch("/template/includes/footer.html")
      .then(response => response.text())
      .then(data => {
        document.getElementById("footer-container").innerHTML = data;
      });