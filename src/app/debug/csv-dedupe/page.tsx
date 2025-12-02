export default function Page() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "20px" }}>
        Debug: CSV Dedupe
      </h1>

      <form
        method="POST"
        action="/api/csv-dedupe"
        encType="multipart/form-data"
      >
        <input type="file" name="file" accept=".csv,.txt" />
        <button
          type="submit"
          style={{
            marginLeft: "10px",
            padding: "5px 12px",
            cursor: "pointer",
          }}
        >
          Upload
        </button>
      </form>
    </div>
  );
}
