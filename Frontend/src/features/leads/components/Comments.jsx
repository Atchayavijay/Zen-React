// File: src/components/Comments.jsx
import React, { useEffect, useState, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import Swal from "sweetalert2";
import { API_BASE_URL } from '@shared/api/client'

export default function Comments({ leadId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  /* -------------------- Init Quill -------------------- */
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Add a comment...",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
        },
      });
    }
  }, []);

  /* -------------------- Fetch Comments -------------------- */
  async function fetchComments() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (data.success) {
        setComments(data.comments || []);
      } else {
        setComments([]);
        Swal.fire("Warning", "No comments found in the database.", "warning");
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (leadId) fetchComments();
  }, [leadId]);

  /* -------------------- Add Comment -------------------- */
  async function handleAddComment() {
    if (!quillRef.current) return;
    const text = quillRef.current.getText().trim();
    const html = quillRef.current.root.innerHTML.trim();

    if (!text) {
      Swal.fire("Error", "Comment text is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ comment_text: html }),
      });

      const result = await response.json();
      if (result.success) {
        Swal.fire("Success", "Comment added successfully!", "success");
        setComments((prev) => [result.comment, ...prev]);
        setActiveTab("all");
        quillRef.current.setContents([]); // clear editor
      } else {
        Swal.fire("Error", "Failed to add comment.", "error");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSaving(false);
    }
  }

  /* -------------------- Edit Comment -------------------- */
  async function handleEditComment(comment) {
    const { value: newText } = await Swal.fire({
      title: "Edit Comment",
      input: "textarea",
      inputValue: comment.comment_text.replace(/<[^>]+>/g, ""), // strip HTML
      showCancelButton: true,
    });

    if (!newText || newText.trim() === comment.comment_text.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${comment.comment_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ comment_text: newText }),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Success", "Comment updated successfully!", "success");
        setComments((prev) =>
          prev.map((c) =>
            c.comment_id === comment.comment_id
              ? { ...c, comment_text: newText }
              : c
          )
        );
      } else {
        Swal.fire("Error", result.error || "Failed to update comment", "error");
      }
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  }

  /* -------------------- Delete Comment -------------------- */
  async function handleDeleteComment(commentId) {
    const confirm = await Swal.fire({
      title: "Delete Comment?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });
    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire("Deleted!", "Comment has been deleted.", "success");
        setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
      } else {
        Swal.fire("Error", result.error || "Failed to delete comment", "error");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  }

  return (
    <div className="border rounded bg-gray-50 mt-6">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-sm ${
            activeTab === "all"
              ? "bg-white border-t border-l border-r rounded-t font-semibold"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`px-4 py-2 text-sm ${
            activeTab === "new"
              ? "bg-white border-t border-l border-r rounded-t font-semibold"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("new")}
        >
          Add New
        </button>
      </div>

      {/* All comments */}
      {activeTab === "all" && (
        <div className="p-4">
          {loading ? (
            <p>Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.comment_id}
                className="border rounded p-3 mb-3 bg-white flex justify-between items-start"
              >
                <div>
                  <p
                    className="mb-1 text-sm"
                    dangerouslySetInnerHTML={{ __html: c.comment_text }}
                  />
                  <small className="text-gray-500">
                    By {c.created_by} on{" "}
                    {new Date(c.created_at).toLocaleString()}
                  </small>
                </div>
                <div className="flex gap-2 text-gray-500 cursor-pointer">
                  <i
                    className="fas fa-edit hover:text-blue-600"
                    onClick={() => handleEditComment(c)}
                  ></i>
                  <i
                    className="fas fa-trash hover:text-red-600"
                    onClick={() => handleDeleteComment(c.comment_id)}
                  ></i>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add new comment */}
      {activeTab === "new" && (
        <div className="p-4">
          <div ref={editorRef} className="bg-white rounded border min-h-[120px]" />
          <button
            onClick={handleAddComment}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}
