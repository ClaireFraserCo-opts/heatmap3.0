import React, { useState, useEffect } from 'react';
import { fetchData } from './utils/fetchData';
import Dropdown from './components/Dropdown';
import Heatmap from './components/Heatmap';
import LoadingIndicator from './components/LoadingIndicator';
import './App.css';

const App = () => {
  const [data, setData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allData = await fetchData('/data/fileList.json');

        // Transform allData into the expected format with fileName and data array
        const transformedData = allData.map(item => ({
          fileName: item.fileName,
          data: item.data.utterances // Adjust according to your actual structure
        }));

        setData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data', error);
        setError(error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFileChange = (fileName) => {
    setSelectedFile(fileName);
  };

  return (
    <div className="App">
      <h1>Therapy Session Heatmap</h1>
      {loading && <LoadingIndicator />}
      {error && <div>Error loading data: {error.message}</div>}
      {!loading && !error && (
        <>
          <Dropdown files={data.map(item => item.fileName)} onChange={handleFileChange} />
          {selectedFile && (
            <Heatmap data={data.find(item => item.fileName === selectedFile)?.data} />
          )}
        </>
      )}
    </div>
  );
};

export default App;
