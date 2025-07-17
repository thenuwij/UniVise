import React, { useState } from "react"
import { FileInput, Label, Spinner } from "flowbite-react"
import { supabase } from "../supabaseClient"

export function FileUpload({
  userId,
  bucket = "reports",
  table = "student_school_data",
  column = "report_url",
  onUpload = () => {}
}) {
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setLoading(true)
    try {
      // 1. build a unique path
      const ext = file.name.split(".").pop()
      const path = `${userId}-${Date.now()}.${ext}`
      console.log(path)
      
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, { upsert: false })
      
      if (error) {
        console.log("Error Uploading to bucket", error)
      } else {
        console.log("Uploaded Successfully to bucket")
      }

      // // 3. get public URL
      // const { publicURL, error: urlErr } = supabase
      //   .storage
      //   .from(bucket)
      //   .getPublicUrl(path)
      // if (urlErr) throw urlErr

      // // 4. persist in your table
      // const { error: dbErr } = await supabase
      //   .from(table)
      //   .update({ column: publicURL })
      //   .eq("user_id", userId)
      // if (dbErr) throw dbErr

      // // 5. notify parent
      // onUpload(publicURL)
    } catch (err) {
      console.error("Upload failed:", err.message)
      alert("Failed to upload file.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full items-center justify-center">
      <Label
        htmlFor="dropzone-file"
        className="relative flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg shadow-md bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-100 dark:hover:border-gray-300 dark:hover:bg-gray-300"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 rounded-lg">
            <Spinner size="lg" />
          </div>
        )}
        <div className={loading ? "opacity-25" : ""}>
          <svg
            className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PDF, PNG, JPG or GIF
          </p>
        </div>
        <FileInput
          id="dropzone-file"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
      </Label>
    </div>
  )
}
