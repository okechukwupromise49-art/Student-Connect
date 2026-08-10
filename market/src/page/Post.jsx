import React, { useState, useRef } from "react";
import { 
  X, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Send,
  Trash2
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_URL from "../Api";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // { file, preview, type }
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    selectedFiles.forEach((file) => {
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type === "application/pdf"
        ? "pdf"
        : "other";

      if (type === "other") {
        toast.error("Only images, videos, and PDFs are allowed");
        return;
      }

      const preview = type === "image" || type === "video" 
        ? URL.createObjectURL(file) 
        : null;

      setFiles((prev) => [...prev, { file, preview, type, name: file.name }]);
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && files.length === 0) {
      toast.error("Please write something or add a file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);

      files.forEach((item) => {
        formData.append("files", item.file);
      });

      const res = await axios.post(
        `${API_URL}/api/posts/create`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
      
        }
      );
      toast.success("successfully Post")
      navigate(-1)

    } catch (err) {
      console.error("Error creating post:", err);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Text Area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share notes, questions, or updates..."
            rows={5}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-800"
          />

          {/* File Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {files.map((item, index) => (
                <div key={index} className="relative group rounded-2xl overflow-hidden border border-gray-200">
                  
                  {/* Image Preview */}
                  {item.type === "image" && (
                    <img
                      src={item.preview}
                      alt="preview"
                      className="w-full h-32 object-cover"
                    />
                  )}

                  {/* Video Preview */}
                  {item.type === "video" && (
                    <video
                      src={item.preview}
                      className="w-full h-32 object-cover"
                      controls
                    />
                  )}

                  {/* PDF Preview */}
                  {item.type === "pdf" && (
                    <div className="w-full h-32 bg-indigo-50 flex flex-col items-center justify-center p-3">
                      <FileText size={32} className="text-indigo-600 mb-2" />
                      <p className="text-xs text-center text-gray-700 truncate w-full">
                        {item.name}
                      </p>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            
            {/* Media Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
              >
                <ImageIcon size={18} className="text-green-600" />
                Media
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*,application/pdf"
                multiple
                className="hidden"
              />
            </div>

            {/* Post Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-60"
            >
              {loading ? (
                "Posting..."
              ) : (
                <>
                  <Send size={18} />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}