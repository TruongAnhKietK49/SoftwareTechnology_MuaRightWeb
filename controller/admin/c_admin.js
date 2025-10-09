async function getAccount() {
  const res = await fetch('http://localhost:3000/admin/accounts');
  const data = await res.json();
  return data;
}
 
// Hàm test get account
async function testGetAccount() {
    try {
        const res = await getAccount();
        console.log(res)
        const tableAccount = document.getElementById('accountTable')
        tableAccount.innerHTML = ''
        res.forEach((account, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${account.Username}</td>
                <td>${account.Email}</td>
                <td>${account.Phone}</td>
                <td><span class="badge ${account.State === 'Active' ? 'bg-success' : 'bg-warning'}">${account.State}</span></td>
                <td><span class="badge ${account.Role == 'Customer' ? 'bg-primary' : account.Role == 'Seller' ? 'bg-secondary' : 'bg-info'}">${account.Role}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary me-2">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            tableAccount.appendChild(row);
        });
    } catch(err) {
        console.log("Lỗi thông báo", err);
    }
}
document.addEventListener('DOMContentLoaded', testGetAccount);
