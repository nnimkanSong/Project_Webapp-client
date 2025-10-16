import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../api";
import "../../css/Admin_usermanagement.css";

const PLACEHOLDER_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=EEE&color=555&size=256&rounded=true";

const ROLES = [
  { key: "user", label: "User" },
  { key: "admin", label: "Admin" },
];

// ✅ helper: ตรวจว่าเป็น admin หรือไม่ (รองรับหลายชื่อฟิลด์และตัวสะกด)
const isAdminRole = (u) => {
  const role = String(
    u.role ?? u.userRole ?? u.userType ?? u.user_type ?? u.type ?? ""
  ).toLowerCase();
  return ["admin", "superadmin", "staff"].includes(role);
};

export default function AdminUserManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [roleFilter, setRoleFilter] = useState("user");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const listByTab =
      roleFilter === "admin"
        ? rows.filter((r) => isAdminRole(r.__raw || r))
        : rows.filter((r) => !isAdminRole(r.__raw || r));

    const q = search.trim().toLowerCase();
    if (!q) return listByTab;

    return listByTab.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const sid = (r.studentId || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      return name.includes(q) || sid.includes(q) || email.includes(q);
    });
  }, [rows, roleFilter, search]);

  useEffect(() => {
    const pick = (obj, keys) => {
      for (const k of keys) {
        if (obj?.[k] != null && obj[k] !== "") return obj[k];
      }
      return undefined;
    };

    const normalizeUser = (u = {}) => {
      // ---- name ----
      const firstName = pick(u, ["username", "firstname", "givenName", "given_name"]);
      const lastName  = pick(u, ["lastName", "lastname", "familyName", "family_name"]);
      const fullName  =
        pick(u, ["name", "fullName", "full_name", "displayName", "display_name"]) ||
        [firstName, lastName].filter(Boolean).join(" ").trim();

      const email = pick(u, ["email", "mail", "userEmail", "username"]);
      const studentId = pick(u, ["studentNumber", "studentId", "student_id"]) || "";

      // ✅ role: รองรับหลายชื่อฟิลด์
      const role =
        (pick(u, ["role", "userRole", "userType", "user_type", "type"]) || "user")
          .toLowerCase();

      const avatarUrl =
        pick(u, ["avatarUrl", "avatar", "photoURL", "photoUrl", "image"]) || "";

      const verificationMethod = pick(u, ["verificationMethod"]) || "";

      const fallbackName =
        fullName && fullName.trim().length
          ? fullName
          : (email || "").split("@")[0] || "User";

      return {
        _id: u._id || u.id,
        name: fallbackName,
        studentId,
        email: email || "",
        role,
        avatarUrl,
        verificationMethod,
        __raw: u, // เก็บต้นฉบับไว้ให้ isAdminRole ใช้
      };
    };

    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        // จะใช้รวมแล้วกรองบน FE หรือจะใส่ ?role= ตาม tab ก็ได้ (ดูตัวเลือกด้านล่าง)
        const res = await api.get("/api/admin/users", { withCredentials: true });
        const data = Array.isArray(res.data) ? res.data : res.data?.users || [];
        setRows(data.map(normalizeUser));
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onView = (u) => {
    const avatar = u.avatarUrl || PLACEHOLDER_AVATAR;
    const name = u.name || "-";
    const sid = u.studentId || "-";
    const email = u.email || "-";
    const role = (u.role || "user").toUpperCase();
    const verificationMethod = u.verificationMethod || "-";

    Swal.fire({
      width: "50%",
      maxWidth: 840,
      showConfirmButton: true,
      confirmButtonText: "ปิด",
      html: `
        <div class="swal-profile">
          <img class="swal-avatar" src="${avatar}" alt="avatar" />
          <div class="swal-info">
            <h3>${name}</h3>
            <div class="swal-grid">
              <div><span>Student ID:</span><b>${sid}</b></div>
              <div><span>Email:</span><b>${email}</b></div>
              <div><span>Role:</span><b>${role}</b></div>
              <div><span>verification:</span><b>${verificationMethod}</b></div>
            </div>
          </div>
        </div>
      `,
    });
  };

  const onDelete = async (u) => {
    const ok = await Swal.fire({
      title: "ลบผู้ใช้นี้?",
      text: `คุณกำลังจะลบ ${u.name || u.email || u.studentId}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#e74c3c",
    });
    if (!ok.isConfirmed) return;

    try {
      await api.delete(`/api/admin/users/${u._id}`, { withCredentials: true });
      setRows((prev) => prev.filter((x) => x._id !== u._id));
      Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "ลบไม่สำเร็จ",
        text: e?.response?.data?.message || e?.message || "เกิดข้อผิดพลาด",
      });
    }
  };

  return (
    <div className="um-page">
      <p className="um-title">Users Management</p>

      <div className="um-toolbar">
        <div className="um-tabs">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRoleFilter(r.key)}
              className={`um-tab ${roleFilter === r.key ? "active" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <input
          className="um-search"
          placeholder="ค้นหา: ชื่อ / รหัสนักศึกษา / อีเมล"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="um-card">
        <div className="um-card-title">
          <p className="um-card-h">Name</p>
          <p className="um-card-h">Student ID</p>
          <p className="um-card-h">Email</p>
          <p className="um-card-h right">Manage</p>
        </div>

        <div className="um-card-body">
          {loading && <div className="um-empty">กำลังโหลดข้อมูล...</div>}
          {err && !loading && <div className="um-error">{err}</div>}
          {!loading && !err && filtered.length === 0 && (
            <div className="um-empty">ไม่พบผู้ใช้</div>
          )}

          {!loading &&
            !err &&
            filtered.map((u, idx) => (
              <div className={`um-row ${idx % 2 ? "alt" : ""}`} key={u._id || idx}>
                <div className="um-cell">
                  <div className="um-name">
                    <img src={u.avatarUrl || PLACEHOLDER_AVATAR} alt="" className="um-avatar" />
                    <span>{u.name || "-"}</span>
                  </div>
                </div>
                <div className="um-cell">{u.studentId || "-"}</div>
                <div className="um-cell">{u.email || "-"}</div>
                <div className="um-cell right">
                  <button className="btn btn-view" onClick={() => onView(u)}>ดู</button>
                  <button className="btn btn-danger" onClick={() => onDelete(u)}>Delete</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
