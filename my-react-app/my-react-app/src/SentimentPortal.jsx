import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const SentimentPortal = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleFileUpload = (event) => {
    setFile(event.target.files[0]);
    setAnalysis(null); // Reset analysis when a new file is uploaded
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/analyze", formData, {
        headers: { Authorization: "Bearer secure_token" },
      });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error uploading file:", error);
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
      <button onClick={handleSubmit} disabled={!file}>
        Analyze
      </button>
      {analysis && (
        <div>
          <Bar data={generateChartData()} />
        </div>
      )}
    </div>
  );
};

export default SentimentPortal;
