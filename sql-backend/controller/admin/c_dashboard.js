// Load dữ liệu thống kê
async function loadingStatistics() {
  const res = await fetch("http://localhost:3000/admin/dashboard/statistics");
  const data = await res.json();
  console.log(data);
  return data;
}


loadingStatistics();