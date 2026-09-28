import React, { useEffect, useState } from "react";
import axios from "axios";
import { Check, Trash2, Flag } from "lucide-react";
import API_URL from "../Api";

export default function AdminUpdateReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/update-reports`,
        {
          withCredentials: true,
        }
      );

      setReports(res.data || []);
    } catch (error) {
      console.error("Fetch reports error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleKeep = async (reportId) => {
    try {
      await axios.patch(
        `${API_URL}/api/update-reports/${reportId}/keep`,
        {},
        {
          withCredentials: true,
        }
      );

      setReports((prev) =>
        prev.map((report) =>
          report._id === reportId
            ? { ...report, status: "kept" }
            : report
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to keep update"
      );
    }
  };

  const handleDelete = async (reportId) => {
    const confirmed = window.confirm(
      "Delete this update permanently?"
    );

    if (!confirmed) return;

    try {
      await axios.patch(
        `${API_URL}/api/update-reports/${reportId}/delete`,
        {},
        {
          withCredentials: true,
        }
      );

      setReports((prev) =>
        prev.map((report) =>
          report._id === reportId
            ? { ...report, status: "deleted" }
            : report
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete update"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading reports...
      </div>
    );
  }

  const pendingReports = reports.filter(
    (report) => report.status === "pending"
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Flag className="text-orange-500" />

            <h1 className="text-2xl font-bold text-gray-900">
              Update Reports
            </h1>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Review updates reported by students.
          </p>
        </div>

        {pendingReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border">
            <p className="font-semibold text-gray-700">
              No pending reports
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Everything is currently reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {pendingReports.map((report) => {
              const update = report.update;

              if (!update) return null;

              return (
                <article
                  key={report._id}
                  className="bg-white rounded-2xl border shadow-sm p-5"
                >
                  {/* Report information */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400">
                        Reported by
                      </p>

                      <p className="font-semibold text-gray-800">
                        {report.reporter?.full_name ||
                          "Student"}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
                      {report.reason}
                    </span>
                  </div>

                  {/* Update */}
                  <div className="mt-5 p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400">
                      Update author
                    </p>

                    <p className="font-semibold text-gray-800">
                      {update.author?.full_name ||
                        "Unknown"}
                    </p>

                    <h2 className="text-lg font-bold text-gray-900 mt-3">
                      {update.title}
                    </h2>

                    {update.body && (
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                        {update.body}
                      </p>
                    )}

                    {update.image && (
                      <img
                        src={update.image}
                        alt={update.title}
                        className="w-full max-h-80 object-cover rounded-xl mt-4"
                      />
                    )}
                  </div>

                  {/* Report description */}
                  {report.description && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500">
                        Reporter explanation
                      </p>

                      <p className="text-sm text-gray-700 mt-1">
                        {report.description}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() =>
                        handleKeep(report._id)
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                    >
                      <Check size={18} />
                      Keep Update
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(report._id)
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold"
                    >
                      <Trash2 size={18} />
                      Delete Update
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}