import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function Prescription() {
    const [file, setFile] = useState(null);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [medicationDetails, setMedicationDetails] = useState(null);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        
        // Create preview URL for the image
        if (selectedFile) {
            const fileUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(fileUrl);
        } else {
            setPreviewUrl(null);
        }
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
        setMedicationDetails(null);
        setShowEmailForm(false);
        setEmailSent(false);

        try {
            // Upload prescription image
            const res = await fetch("http://127.0.0.1:8000/process_prescription", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to upload file");

            const data = await res.json();
            console.log("Raw Response:", data);
            setResponse(data);
            const cleanedText = data.extracted_text;

            const genAI = new GoogleGenerativeAI("");
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Extract the data in given format prescription: [
                {
                  "medicine": "Paracetamol",
                  "dosage": "500mg",
                  "timing": ["after lunch"],
                    "duration": "5 days"
                },
                {
                  "medicine": "Amoxicillin",
                  "dosage": "250mg",
                  "timing": ["before lunch", "after lunch"],
                    "duration": "7 days"
                }] ${cleanedText}`;
            const result = await model.generateContent(prompt);
            const resultText = result.response.text();
            setResponse(prevResponse => ({
                ...prevResponse,
                generative_ai_response: resultText
            }));
            
            // Parse the JSON response for medication details
            try {
                // Find JSON in the response (looking for text between square brackets)
                const jsonMatch = resultText.match(/\[\s*\{.*\}\s*\]/s);
                if (jsonMatch) {
                    const medicationJson = JSON.parse(jsonMatch[0]);
                    setMedicationDetails(medicationJson);
                    
                    // Show email form after successful processing
                    setShowEmailForm(true);
                }
            } catch (jsonError) {
                console.error("Error parsing medication JSON:", jsonError);
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSendReminders = async () => {
        if (!email || !email.includes('@')) {
            alert("Please enter a valid email address.");
            return;
        }

        setSendingEmail(true);
        
        try {
            // Call backend endpoint to send email reminders
            const response = await fetch("http://localhost:7000/medications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    medications: medicationDetails,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send email reminders");
            }
            
            setEmailSent(true);
            alert("Medication reminders have been set up successfully! You will receive email notifications based on your prescription schedule.");
        } catch (error) {
            console.error("Error sending email reminders:", error);
            alert("Failed to set up reminders. Please try again later.");
        } finally {
            setSendingEmail(false);
        }
    };

    // Function to render medication details as cards with simplified format
    const renderMedicationCards = (medications) => {
        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            return <p className="text-gray-600">No medication details available.</p>;
        }
        
        return medications.map((med, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h4 className="text-lg font-semibold text-blue-800 mb-3 text-center">{med.medicine}</h4>
                
                <div className="mb-4 text-center">
                    <p className="font-medium text-gray-700 mb-1">Dosage:</p>
                    <p>{med.dosage || "Not specified"}</p>
                </div>
                <div className="mb-4 text-center">
                    <p className="font-medium text-gray-700 mb-1">Duration:</p>
                    <p>{med.duration|| "Not specified"}</p>
                </div>               
                <div className="text-center">
                    <p className="font-medium text-gray-700 mb-2">Timing:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {Array.isArray(med.timing) && med.timing.length > 0 ? 
                            med.timing.map((time, i) => (
                                <span key={i} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">{time}</span>
                            )) : 
                            <span className="text-gray-500">Not specified</span>
                        }
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-6xl mx-auto">
                <header className="bg-blue-700 text-white shadow-md">
                    <div className="container mx-auto px-4 py-4 flex items-center">
                        <img 
                            src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png" 
                            alt="Medical Icon" 
                            className="mr-3 h-10 w-10" 
                        />
                        <h1 className="text-2xl font-semibold">Medical Prescription Verification</h1>
                    </div>
                </header>
                
                <main className="container mx-auto px-4 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <label 
                                htmlFor="prescription-upload" 
                                className="block p-6 bg-white rounded-lg shadow-md text-center cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors"
                            >
                                <img 
                                    src="https://cdn-icons-png.flaticon.com/512/25/25607.png" 
                                    alt="Upload Icon" 
                                    className="mx-auto mb-3 h-16 w-16" 
                                />
                                <p className="text-gray-600 mb-4">Upload your prescription image</p>
                                <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                    Select Prescription Image
                                </span>
                                <input 
                                    id="prescription-upload"
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    className="hidden"
                                />
                            </label>

                            {previewUrl && (
                                <div className="p-4 bg-white rounded-lg shadow-md">
                                    <img 
                                        src={previewUrl} 
                                        alt="Prescription Preview" 
                                        className="max-w-full h-auto mx-auto rounded-md" 
                                    />
                                </div>
                            )}

                            <button 
                                onClick={handleUpload} 
                                disabled={loading} 
                                className={`w-full py-3 rounded-md shadow-sm font-medium text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                            >
                                {loading ? "Processing..." : "Verify Prescription"}
                            </button>
                            
                            {/* Email Reminder Section */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">Set Up Medication Reminders</h4>
                                <p className="text-gray-600 mb-4">
                                    Never miss a dose! We'll send you timely reminders based on your prescribed medications.
                                </p>
                                
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input 
                                        id="email"
                                        type="email" 
                                        placeholder="your.email@example.com" 
                                        value={email}
                                        onChange={handleEmailChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div className="flex items-center mb-4">
                                    <input 
                                        id="consent"
                                        type="checkbox" 
                                        className="h-4 w-4 text-blue-600 rounded"
                                        defaultChecked
                                    />
                                    <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
                                        I consent to receive email reminders about my medication
                                    </label>
                                </div>
                                
                                <button 
                                    onClick={handleSendReminders}
                                    disabled={!medicationDetails || sendingEmail}
                                    className={`w-full py-2 rounded-md shadow-sm font-medium text-white ${!medicationDetails || sendingEmail ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                                >
                                    {sendingEmail ? "Setting up reminders..." : "Set Up Reminders"}
                                </button>
                                
                                {emailSent && (
                                    <div className="mt-4 flex items-center p-3 bg-green-50 text-green-700 rounded-md">
                                        <img 
                                            src="https://cdn-icons-png.flaticon.com/512/190/190411.png" 
                                            alt="Success Icon" 
                                            className="mr-2 h-6 w-6"
                                        />
                                        <span>Reminders set up successfully! You'll receive timely notifications based on your medication schedule.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            {/* Display medication details section */}
                            {(medicationDetails || response) && (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                        <img 
                                            src="https://cdn-icons-png.flaticon.com/512/3004/3004458.png" 
                                            alt="Medication Icon" 
                                            className="mr-2 h-6 w-6" 
                                        />
                                        Prescribed Medications
                                    </h3>
                                    
                                    {/* Display the actual medication details if available */}
                                    <div className="space-y-4">
                                        {renderMedicationCards(medicationDetails || [])}
                                    </div>
                                </>
                            )}

                            {response && (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4 flex items-center">
                                        <img 
                                            src="https://cdn-icons-png.flaticon.com/512/3004/3004458.png" 
                                            alt="Medicine Icon" 
                                            className="mr-2 h-6 w-6" 
                                        />
                                        Detected Medications
                                    </h3>
                                    {response.detected_medicines && response.detected_medicines.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                            {response.detected_medicines.map((med, index) => (
                                                <li key={index}>{med}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-600">No medications detected in the prescription.</p>
                                    )}
                                </>
                            )}

                            {!medicationDetails && !response && (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                        <img 
                                            src="https://cdn-icons-png.flaticon.com/512/1632/1632596.png" 
                                            alt="Results Icon" 
                                            className="mr-2 h-6 w-6" 
                                        />
                                        Verification Results
                                    </h3>
                                    <p className="text-gray-500 text-center my-8">
                                        Upload a prescription image to see verification results here
                                    </p>
                                    <img 
                                        src="https://cdn-icons-png.flaticon.com/512/1376/1376544.png" 
                                        alt="Empty results" 
                                        className="mx-auto my-8 opacity-50 h-48 w-48" 
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </main>
                
                <footer className="bg-gray-800 text-white mt-8">
                    <div className="container mx-auto px-4 py-6 text-center">
                        <p className="mb-2">Prescription verification powered by AI technology</p>
                        <p>© 2025 Medical Verification Services</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Prescription;