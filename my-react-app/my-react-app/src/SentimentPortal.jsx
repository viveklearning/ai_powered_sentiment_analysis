import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const SentimentPortal = () => {
  const [file, setFile] = useState(null); // Holds the selected file
  const [analysis, setAnalysis] = useState(null); // Holds analysis data
  const [loading, setLoading] = useState(false); // Track loading state

  const handleFileUpload = (event) => {
    setFile(event.target.files[0]); // Update file state
    setAnalysis(null); // Reset analysis when a new file is uploaded
  };

  const handleSubmit = async () => {
    if (!file) return; // Ensure a file is selected
    setLoading(true); // Start loading
    setAnalysis(null); // Clear previous analysis results

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send the file for analysis
      const response = await axios.post("http://localhost:8000/analyze", formData, {
        headers: { Authorization: "Bearer secure_token" },
      });
      setAnalysis(response.data.analysis); // Update analysis results
    } catch (error) {
      console.error("Error during analysis:", error);
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleDownload = async () => {
    if (!analysis) return; // Ensure there is analysis data

    try {
      const formData = new FormData(); // Send empty formData for CSV download
      const response = await axios.post("http://localhost:8000/analyze", formData, {
        headers: { Authorization: "Bearer secure_token" },
        params: { download: "csv" }, // Request CSV download
        responseType: "blob", // Set the response type to blob for file download
      });

      // Create a link element to trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(response.data);
      link.download = "analysis_results.csv"; // Set the file name
      link.click(); // Trigger the download
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
  };

  const generateChartData = () => {
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    analysis.forEach((item) => sentimentCounts[item.sentiment]++);

    return {
      labels: ["Positive", "Neutral", "Negative"],
      datasets: [
        {
          label: "Sentiment Distribution",
          data: [sentimentCounts.positive, sentimentCounts.neutral, sentimentCounts.negative],
          backgroundColor: ["#4caf50", "#ffeb3b", "#f44336"],
        },
      ],
    };
  };

  return (
    <div>
      <h1>Sentiment Analysis Portal</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <button onClick={handleSubmit} disabled={loading || !file}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      {analysis && (
        <div>
          <Bar data={generateChartData()} />
          <button onClick={handleDownload}>Download Results as CSV</button>
        </div>
      )}
    </div>
  );
};

export default SentimentPortal;
