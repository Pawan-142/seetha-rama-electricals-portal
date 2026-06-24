// ==========================================
// USER PROFILE MODULE CONTROLLER (STAFF MANAGEMENT)
// ==========================================

let userEditMode = false;
let currentEditUsername = "";
let allUsers = [];

async function loadUsers() {
  setActiveNav("navUsers");
  showPage("users");

  document.getElementById("users").innerHTML = `
    <div class="inventory-header">
      <h2 style="margin: 0; font-size: 26px; font-weight: 700;">Staff Profiles</h2>
      <button class="btn btn-primary" onclick="openUserModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Staff Member
      </button>
    </div>

    <!-- Search Input -->
    <div class="card-box mb-4" style="padding: 16px;">
      <input
        type="text"
        id="searchUserInput"
        class="form-control"
        placeholder="Search staff members by name, username, or role..."
        onkeyup="searchUsers(this.value)"
      >
    </div>

    <div id="usersTableContainer">
      <div style="text-align: center; color: var(--slate-400); padding: 40px;">Loading user accounts...</div>
    </div>
  `;

  await fetchUsers();
}

async function fetchUsers() {
  try {
    const users = await getCachedData("users");
    allUsers = users;
    renderUsers(users);
  } catch (err) {
    console.error(err);
    document.getElementById("usersTableContainer").innerHTML = `
      <div style="text-align: center; color: var(--danger); padding: 30px; font-weight: 600;">
        Unable to load user accounts from Google Sheets.
      </div>
    `;
  }
}

function renderUsers(users) {
  if (users.length === 0) {
    document.getElementById("usersTableContainer").innerHTML = `
      <div style="text-align: center; color: var(--slate-500); padding: 40px; font-weight: 500;">
        No user accounts found in the database.
      </div>
    `;
    return;
  }

  // Get current logged-in user to prevent self-deletion
  let currentUsername = "";
  try {
    const u = JSON.parse(localStorage.getItem("sre_user") || "{}");
    currentUsername = (u.username || "").toLowerCase();
  } catch (e) {}

  let html = `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full Name</th>
            <th>Role</th>
            <th style="text-align: center; width: 180px;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  users.forEach(user => {
    const uname = (user.username || "").toString().trim();
    const isSelf = uname.toLowerCase() === currentUsername;

    html += `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">${uname}</td>
        <td style="font-weight: 600; color: var(--text-main);">${user.name || "N/A"}</td>
        <td>
          <span class="badge ${user.role === 'admin' ? 'badge-success' : 'badge-warning'}">
            ${user.role === 'admin' ? 'Administrator' : 'Staff'}
          </span>
        </td>
        <td style="text-align: center;">
          <div class="table-actions">
            <button class="btn-action btn-edit" onclick="openEditUserModal('${uname}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
              Edit
            </button>
            ${isSelf ? `
              <button class="btn-action btn-self" title="You cannot delete yourself" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Self
              </button>
            ` : `
              <button class="btn-action btn-delete" onclick="deleteUser('${uname}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Delete
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("usersTableContainer").innerHTML = html;
}

function searchUsers(keyword) {
  const rows = document.querySelectorAll("#usersTableContainer tbody tr");
  const cleanedKeyword = keyword.toLowerCase().trim();

  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(cleanedKeyword) ? "" : "none";
  });
}

function openUserModal() {
  userEditMode = false;
  currentEditUsername = "";

  document.querySelector("#userModal .modal-header h3").innerText = "Add New Staff Member";
  document.querySelector("#userModal button[type='submit']").innerText = "Save Profile";

  document.getElementById("userForm").reset();
  
  // Make username field editable and password required
  document.getElementById("u_username").disabled = false;
  document.getElementById("u_password").required = true;
  document.getElementById("u_password").placeholder = "••••••••";

  document.getElementById("userModal").classList.add("active");
}

function openEditUserModal(username) {
  userEditMode = true;
  currentEditUsername = username;

  const user = allUsers.find(u => u.username.toString().toLowerCase() === username.toLowerCase());
  if (!user) return;

  document.querySelector("#userModal .modal-header h3").innerText = "Edit Staff Profile";
  document.querySelector("#userModal button[type='submit']").innerText = "Save Changes";

  document.getElementById("u_name").value = user.name || "";
  document.getElementById("u_username").value = user.username || "";
  document.getElementById("u_role").value = user.role || "staff";
  
  // Disable username editing and make password optional
  document.getElementById("u_username").disabled = true;
  document.getElementById("u_password").value = "";
  document.getElementById("u_password").required = false;
  document.getElementById("u_password").placeholder = "Leave blank to keep current password";

  document.getElementById("userModal").classList.add("active");
}

function closeUserModal() {
  document.getElementById("userModal").classList.remove("active");
}

async function saveUserModal(event) {
  event.preventDefault();
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  submitBtn.innerText = userEditMode ? "Saving..." : "Creating...";
  submitBtn.disabled = true;

  const data = {
    name: document.getElementById("u_name").value.trim(),
    username: document.getElementById("u_username").value.trim(),
    role: document.getElementById("u_role").value,
    password: document.getElementById("u_password").value
  };

  const payload = {
    action: userEditMode ? "editUser" : "addUser",
    ...data
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      showToast(userEditMode ? "User profile updated successfully!" : "User account created successfully!", "success");
      closeUserModal();
      invalidateCache("users");
      await loadUsers();
    } else {
      showToast(result.message || "Failed to save user profile.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Could not write user to Sheets.", "error");
  } finally {
    submitBtn.innerText = userEditMode ? "Save Changes" : "Save Profile";
    submitBtn.disabled = false;
  }
}

async function deleteUser(username) {
  if (!confirm(`Are you sure you want to delete user "${username}"? They will lose access to the system.`)) {
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteUser",
        username: username
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast("User profile deleted successfully!", "success");
      invalidateCache("users");
      await loadUsers();
    } else {
      showToast(result.message || "Failed to delete user.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Could not delete user.", "error");
  }
}

document.addEventListener("sreCacheUpdated", (e) => {
  if (e.detail.action === "users") {
    const usersEl = document.getElementById("users");
    if (usersEl && usersEl.style.display === "block") {
      fetchUsers();
    }
  }
});
