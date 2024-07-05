// src/utils/fetchData.js

export async function fetchData(filePath) {
    try {
      const response = await fetch('/data/fileList.json');
      const fileList = await response.json();
      
      // Filter out 'fileList.json' itself
      const files = fileList.filter(file => file !== 'fileList.json');
  
      // Fetch and process each JSON file
      const dataPromises = files.map(async (file) => {
        const res = await fetch(`/data/${file}`);
        const jsonData = await res.json();
        return { fileName: file, data: jsonData };
      });
  
      const allData = await Promise.all(dataPromises);
      return allData;
    } catch (error) {
      console.error('Error fetching data:', error.message);
      throw error;
    }
  }
  