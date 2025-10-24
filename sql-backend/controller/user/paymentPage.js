// Xử lý chọn phương thức thanh toán
document.querySelectorAll(".payment-method").forEach((method) => {
  method.addEventListener("click", function () {
    document.querySelectorAll(".payment-method").forEach((m) => {
      m.classList.remove("active");
    });
    this.classList.add("active");
  });
});
