import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function Prescription() {
    const [file, setFile] = useState(null);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        setResponse(null);

        try {
            // Upload prescription image
            const res = await fetch("http://127.0.0.1:8000/process_prescription", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to upload file");

            const data = await res.json();
            console.log("Raw Response:", data);
            const cleanedText = data.extracted_text;

            const genAI = new GoogleGenerativeAI("");
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Extract the data in given format prescription: [
                   {
                     "medicine": "Paracetamol",
                     "dosage": "500mg",
                     "timing": ["after lunch"]
                   },
                   {
                     "medicine": "Amoxicillin",
                     "dosage": "250mg",
                     "timing": ["before lunch", "after lunch"]
                   },
                   {
                     "medicine": "Vitamin D3",
                     "dosage": "1000IU",
                     "colour": "yellow",
                     "timing": ["with breakfast"]
                   },
                   {
                     "medicine": "Metformin",
                     "dosage": "850mg",
                     "timing": ["after breakfast", "after dinner"]
                   }] ${cleanedText}`;
            const result = await model.generateContent(prompt);console.log(result.response.text());
 

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }

    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Medical Bill Verification</h2>

            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={loading} style={{ marginLeft: "10px" }}>
                {loading ? "Processing..." : "Upload & Verify"}
            </button>

            {response && (
                <div style={{ marginTop: "20px", textAlign: "left", display: "inline-block" }}>
                    <h3>Detected Medicines:</h3>
                    {response.detected_medicines && response.detected_medicines.length > 0 ? (
                        <ul>
                            {response.detected_medicines.map((med, index) => (
                                <li key={index}>{med}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No medicines detected.</p>
                    )}

                    <h3>Extracted Text:</h3>
                    {Array.isArray(response.extracted_text) ? (
                        response.extracted_text.length > 0 ? (
                            <ul>
                                {response.extracted_text.map((text, index) => (
                                    <li key={index}>{text}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No text extracted.</p>
                        )
                    ) : (
                        <p>{response.extracted_text ? response.extracted_text : "No text extracted."}</p>
                    )}

                    <h3>Price Details:</h3>
                    {response.medicine_prices && Object.keys(response.medicine_prices).length > 0 ? (
                        <ul>
                            {Object.entries(response.medicine_prices).map(([med, price]) => (
                                <li key={med}>
                                    <strong>{med}:</strong> {price === "Not Found" || !price ? "Not Available" : `$${parseFloat(price).toFixed(2)}`}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Price details not available.</p>
                    )}

                    <h3>Bill Details:</h3>
                    <p>Expected Bill: <strong>${response.expected_total ? response.expected_total.toFixed(2) : "N/A"}</strong></p>
                    <p>Actual Bill: <strong>${response.actual_bill ? response.actual_bill.toFixed(2) : "N/A"}</strong></p>

                    {response.difference !== undefined && (
                        <p style={{ color: response.difference > 0 ? "red" : "green" }}>
                            Difference: ${response.difference.toFixed(2)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Prescription;