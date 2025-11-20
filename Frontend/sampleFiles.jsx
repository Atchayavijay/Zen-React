// import React, { useState } from "react";
// // import a rich text editor like react-quill if you want
// // import ReactQuill from "react-quill";
// // import "react-quill/dist/quill.snow.css";

// const SECTIONS = [
//   { key: "personal", label: "Personal Info", icon: "fa-user" },
//   { key: "course", label: "Course Details", icon: "fa-book" },
//   { key: "assignee", label: "Assignee Info", icon: "fa-user-tie" },
//   { key: "financial", label: "Financial Info", icon: "fa-university" },
//   { key: "classification", label: "Classification", icon: "fa-tags" },
//   { key: "status", label: "Status Info", icon: "fa-info-circle" },
// ];

// export default function EditLeadModal({ open, onClose, lead, comments }) {
//   const [activeSection, setActiveSection] = useState("personal");
//   const [commentTab, setCommentTab] = useState("all");
//   const [comment, setComment] = useState("");
//   const [optionsOpen, setOptionsOpen] = useState(false);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-0">
//         <div className="flex justify-between items-center border-b px-6 py-4">
//           <h2 className="text-xl font-semibold">Edit Lead</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 focus:outline-none"
//             aria-label="Close"
//           >
//             <i className="fas fa-times text-lg"></i>
//           </button>
//           <div className="relative">
//             <button
//               className="text-gray-500 hover:text-gray-700 focus:outline-none"
//               onClick={() => setOptionsOpen(!optionsOpen)}
//               aria-label="Options"
//             >
//               <i className="fas fa-ellipsis-v text-lg"></i>
//             </button>
//             {optionsOpen && (
//               <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg">
//                 <button
//                   className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none"
//                   onClick={() => {
//                     setOptionsOpen(false);
//                     // Add delete logic here
//                   }}
//                 >
//                   Delete
//                 </button>
//                 <button
//                   className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none"
//                   onClick={() => {
//                     setOptionsOpen(false);
//                     // Add archive logic here
//                   }}
//                 >
//                   Archive
//                 </button>
//                 <button
//                   className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none"
//                   onClick={() => {
//                     setOptionsOpen(false);
//                     // Add on hold logic here
//                   }}
//                 >
//                   On Hold
//                 </button>
//                 <button
//                   className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none"
//                   onClick={() => {
//                     setOptionsOpen(false);
//                     // Add edit logic here
//                   }}
//                 >
//                   Edit
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//         <div className="flex">
//           {/* Sidebar */}
//           <div className="w-1/4 border-r p-4">
//             {SECTIONS.map((s) => (
//               <button
//                 key={s.key}
//                 className={`flex items-center w-full px-3 py-2 mb-2 rounded ${
//                   activeSection === s.key
//                     ? "bg-gray-200 font-bold"
//                     : "hover:bg-gray-100"
//                 }`}
//                 onClick={() => setActiveSection(s.key)}
//               >
//                 <i className={`fa ${s.icon} mr-2`} />
//                 {s.label}
//               </button>
//             ))}
//           </div>
//           {/* Main Info */}
//           <div className="w-3/4 p-6">
//             {activeSection === "personal" && (
//               <div>
//                 <h3 className="font-semibold mb-4 flex items-center">
//                   <i className="fa fa-user mr-2" /> Personal Information
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <InfoRow label="Name" value={lead?.name} icon="fa-user" />
//                   <InfoRow
//                     label="Mobile"
//                     value={lead?.mobile_number}
//                     icon="fa-phone"
//                     isLink
//                   />
//                   <InfoRow
//                     label="Email"
//                     value={lead?.email || "N/A"}
//                     icon="fa-envelope"
//                   />
//                   <InfoRow
//                     label="Role"
//                     value={lead?.role || "N/A"}
//                     icon="fa-briefcase"
//                   />
//                   <InfoRow
//                     label="College/Company"
//                     value={lead?.college_company || "N/A"}
//                     icon="fa-building"
//                   />
//                   <InfoRow
//                     label="Location"
//                     value={lead?.location || "N/A"}
//                     icon="fa-map-marker-alt"
//                   />
//                   <InfoRow
//                     label="Source"
//                     value={lead?.source || "N/A"}
//                     icon="fa-link"
//                   />
//                 </div>
//               </div>
//             )}
//             {activeSection === "course" && (
//               <div>
//                 <h3 className="font-semibold mb-4 flex items-center">
//                   <i className="fa fa-book mr-2" /> Course Details
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <InfoRow
//                     label="Course Name"
//                     value={lead?.course_name || lead?.course || "N/A"}
//                     icon="fa-book"
//                   />
//                   <InfoRow
//                     label="Batch"
//                     value={lead?.batch_name || lead?.batch_id || "N/A"}
//                     icon="fa-users"
//                   />
//                   <InfoRow
//                     label="Trainer"
//                     value={lead?.trainer_name || lead?.trainer_id || "N/A"}
//                     icon="fa-chalkboard-teacher"
//                   />
//                   <InfoRow
//                     label="Course Type"
//                     value={lead?.course_type || "N/A"}
//                     icon="fa-list-alt"
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//         {/* Comments Section */}
//         <div className="border-t p-6">
//           <h4 className="font-semibold mb-2">Comments</h4>
//           <div className="flex mb-2">
//             <button
//               className={`mr-2 px-3 py-1 rounded ${
//                 commentTab === "all" ? "bg-gray-200" : "bg-gray-100"
//               }`}
//               onClick={() => setCommentTab("all")}
//             >
//               All
//             </button>
//             <button
//               className={`px-3 py-1 rounded ${
//                 commentTab === "add" ? "bg-gray-200" : "bg-gray-100"
//               }`}
//               onClick={() => setCommentTab("add")}
//             >
//               Add New
//             </button>
//           </div>
//           {commentTab === "all" ? (
//             <div>
//               {/* Render comments here */}
//               {comments?.length ? (
//                 comments.map((c) => (
//                   <div key={c.id} className="mb-2 p-2 bg-gray-50 rounded">
//                     {c.text}
//                   </div>
//                 ))
//               ) : (
//                 <div>Loading comments...</div>
//               )}
//             </div>
//           ) : (
//             <form
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 // handle comment submit
//               }}
//             >
//               {/* <ReactQuill value={comment} onChange={setComment} /> */}
//               <textarea
//                 className="w-full border rounded p-2 mb-2"
//                 rows={3}
//                 placeholder="Add a comment..."
//                 value={comment}
//                 onChange={(e) => setComment(e.target.value)}
//               />
//               <button
//                 className="bg-blue-600 text-white px-4 py-2 rounded"
//                 type="submit"
//               >
//                 Submit
//               </button>
//             </form>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function InfoRow({ label, value, icon, isLink }) {
//   return (
//     <div className="flex items-center mb-2">
//       <i className={`fa ${icon} text-gray-500 mr-2`} />
//       <span className="font-semibold">{label}:</span>
//       {isLink && value ? (
//         <a href={`tel:${value}`} className="ml-2 text-blue-600 underline">
//           {value}
//         </a>
//       ) : (
//         <span className="ml-2">{value || "N/A"}</span>
//       )}
//     </div>
//   );
// }



import React, { useState } from "react";

const SECTIONS = [
  { key: "personal", label: "Personal Info", icon: "fa-user" },
  { key: "course", label: "Course Details", icon: "fa-book" },
  { key: "assignee", label: "Assignee Info", icon: "fa-user-tie" },
  { key: "financial", label: "Financial Info", icon: "fa-university" },
  { key: "classification", label: "Classification", icon: "fa-tags" },
  { key: "status", label: "Status Info", icon: "fa-info-circle" },
];

export default function EditLeadModal({ open, onClose, lead, comments }) {
  const [activeSection, setActiveSection] = useState("personal");
  const [commentTab, setCommentTab] = useState("all");
  const [comment, setComment] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
      {/* Card */}
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-[22px] font-semibold tracking-tight">Edit Lead</h2>

          <div className="ml-auto flex items-center gap-1">
            {/* Kebab */}
            <div className="relative">
              <button
                type="button"
                className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                onClick={() => setOptionsOpen((v) => !v)}
                aria-label="Options"
              >
                <i className="fas fa-ellipsis-v" />
              </button>
              {optionsOpen && (
                <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-lg border bg-white shadow-xl">
                  <MenuBtn
                    label="Delete"
                    onClick={() => setOptionsOpen(false)}
                  />
                  <MenuBtn
                    label="Archive"
                    onClick={() => setOptionsOpen(false)}
                  />
                  <MenuBtn
                    label="On Hold"
                    onClick={() => setOptionsOpen(false)}
                  />
                  <MenuBtn label="Edit" onClick={() => setOptionsOpen(false)} />
                </div>
              )}
            </div>

            {/* Close (fixed & reliable) */}
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
              aria-label="Close"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 border-r p-4">
            <nav className="space-y-2">
              {SECTIONS.map((s) => {
                const active = activeSection === s.key;
                return (
                  <button
                    key={s.key}
                    className={[
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                      active
                        ? "bg-gray-100 font-semibold text-gray-900 ring-1 ring-gray-200"
                        : "text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                    onClick={() => setActiveSection(s.key)}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        active ? "bg-blue-50 text-blue-600" : "bg-gray-100",
                      ].join(" ")}
                    >
                      <i className={`fa ${s.icon}`} />
                    </span>
                    <span className="text-[14px]">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-h-[420px] flex-1 p-6">
            {activeSection === "personal" && (
              <Section title="Personal Information" icon="fa-user">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoRow label="Name" value={lead?.name} icon="fa-user" />
                  <InfoRow
                    label="Mobile"
                    value={lead?.mobile_number}
                    icon="fa-phone"
                    isLink
                  />
                  <InfoRow
                    label="Email"
                    value={lead?.email || "N/A"}
                    icon="fa-envelope"
                  />
                  <InfoRow
                    label="Role"
                    value={lead?.role || "N/A"}
                    icon="fa-briefcase"
                  />
                  <InfoRow
                    label="College/Company"
                    value={lead?.college_company || "N/A"}
                    icon="fa-building"
                  />
                  <InfoRow
                    label="Location"
                    value={lead?.location || "N/A"}
                    icon="fa-map-marker-alt"
                  />
                  <InfoRow
                    label="Source"
                    value={lead?.source || "N/A"}
                    icon="fa-link"
                  />
                </div>
              </Section>
            )}

            {activeSection === "course" && (
              <Section title="Course Details" icon="fa-book">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoRow
                    label="Course Name"
                    value={lead?.course_name || lead?.course || "N/A"}
                    icon="fa-book"
                  />
                  <InfoRow
                    label="Batch"
                    value={lead?.batch_name || lead?.batch_id || "N/A"}
                    icon="fa-users"
                  />
                  <InfoRow
                    label="Trainer"
                    value={lead?.trainer_name || lead?.trainer_id || "N/A"}
                    icon="fa-chalkboard-teacher"
                  />
                  <InfoRow
                    label="Course Type"
                    value={lead?.course_type || "N/A"}
                    icon="fa-list-alt"
                  />
                </div>
              </Section>
            )}

            {activeSection !== "personal" && activeSection !== "course" && (
              <div className="text-sm text-gray-500">
                (UI placeholder for “{SECTIONS.find(s=>s.key===activeSection)?.label}”)
              </div>
            )}
          </main>
        </div>

        {/* Comments */}
        <div className="border-t px-6 py-5">
          <h4 className="mb-3 text-[15px] font-semibold">Comments</h4>

          <div className="mb-3 flex gap-2">
            <TabBtn
              active={commentTab === "all"}
              onClick={() => setCommentTab("all")}
              label="All"
            />
            <TabBtn
              active={commentTab === "add"}
              onClick={() => setCommentTab("add")}
              label="Add New"
            />
          </div>

          {commentTab === "all" ? (
            <div className="space-y-2">
              {comments?.length ? (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border bg-gray-50 px-3 py-2 text-sm"
                  >
                    {c.text}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border bg-white px-3 py-10 text-center text-sm text-gray-500">
                  Loading comments...
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // handle comment submit
              }}
              className="space-y-2"
            >
              <textarea
                rows={4}
                placeholder="Add a comment..."
                className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none ring-0 focus:border-blue-400"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- small building blocks ---------- */

function Section({ title, icon, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
          <i className={`fa ${icon}`} />
        </span>
        <h3 className="text-[15px] font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value, icon, isLink }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600">
        <i className={`fa ${icon}`} />
      </span>

      <div className="flex-1">
        <span className="text-[12px] font-semibold text-gray-700">{label}</span>
        <div className="text-[13px]">
          {isLink && value ? (
            <a href={`tel:${value}`} className="text-blue-700 underline">
              {value}
            </a>
          ) : (
            <span className="text-gray-800">{value || "N/A"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuBtn({ label, onClick }) {
  return (
    <button
      className="block w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-[13px]",
        active
          ? "bg-gray-200 font-medium text-gray-900"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
