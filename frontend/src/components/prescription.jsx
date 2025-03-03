import React, { useState } from 'react';

export default function Prescription() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractionType, setExtractionType] = useState('patient_details');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError(null);
  };

  const handleExtractionTypeChange = (e) => {
    setExtractionType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file_format", extractionType);
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/extract_from_doc", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setResponse(data);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Document Extraction</h2>
          <p className="mt-2 text-sm text-gray-600">Upload medical documents to extract information</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Document</label>
              <input type="file" className="w-full border p-2 rounded" onChange={handleFileChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Extraction Type</label>
              <select className="w-full border p-2 rounded" value={extractionType} onChange={handleExtractionTypeChange}>
                <option value="patient_details">patient_details</option>
                <option value="prescription">prescription</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Extract Information'}
          </button>
        </form>

        {response && (
          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-gray-900">Extraction Results</h3>
            <pre className="mt-2 text-sm text-gray-700 overflow-auto">{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
