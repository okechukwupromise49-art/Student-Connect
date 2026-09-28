import React, { useState } from "react";

const reasons = [
  {
    value: "incorrect",
    label: "Incorrect information",
  },
  {
    value: "outdated",
    label: "Outdated information",
  },
  {
    value: "spam",
    label: "Spam",
  },
  {
    value: "misleading",
    label: "Misleading information",
  },
  {
    value: "other",
    label: "Other",
  },
];

export default function ReportModal({
  update,
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      alert("Please select a reason.");
      return;
    }

    try {
      setLoading(true);

      await onSubmit(
        update._id,
        reason,
        description
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">
          Report Update
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Why do you think this update should be reviewed?
        </p>

        <div className="space-y-2 mt-5">
          {reasons.map((item) => (
            <label
              key={item.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                reason === item.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={item.value}
                checked={reason === item.value}
                onChange={(e) =>
                  setReason(e.target.value)
                }
              />

              <span className="text-sm text-gray-700">
                {item.label}
              </span>
            </label>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Tell the admin what is wrong..."
          maxLength={500}
          rows={4}
          className="w-full mt-4 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}