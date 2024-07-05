// processConversationData.js

const processConversationData = (conversationData) => {
    // Process and manipulate conversationData as needed
    // Example:
    const processedData = conversationData.map((item) => ({
      id: item.id,
      text: item.text,
      score: item.score,
      // Additional processing logic
    }));
  
    return processedData;
  };
  
  export default processConversationData;
  