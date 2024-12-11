import React, { useEffect, useState } from 'react';
import { events, invoke } from '@forge/bridge';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa'; // Add FaSpinner for loading animation
import jsonpath from 'jsonpath'; // Add jsonpath library

function App() {
  const [data, setData] = useState(null);
  const [completeness, setCompleteness] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  const handleFetchSuccess = (data) => {
    setData(data);
    if (Object.keys(data).length === 0) {
      throw new Error('No properties returned');
    }
  };
  const handleFetchError = () => {
    console.error('Failed to get properties');
  };

  const sendTextSummary = (textSummary) => {
    if (!textSummary.trim()) {
      setLoading(false);
      setError('Text summary is empty');
      return;
    }

    invoke('sendTextSummary', { textSummary })
      .then((response) => {
        setCompleteness(response.completeness);
        setRecommendations(response.recommendations);
        setLoading(false); // Set loading to false when data is received
        setError(null); // Clear error on success
      })
      .catch((error) => {
        console.error('Failed to send text summary', error);
        setLoading(false); // Set loading to false on error
        setError('Failed to send text summary');
      });
  };

  useEffect(() => {
    const fetchProperties = () => {
      setLoading(true);
      invoke('fetchIssueData')
        .then(handleFetchSuccess)
        .catch(handleFetchError);
    };

    fetchProperties();

    const handleIssueChanged = () => {
      fetchProperties();
    };

    events.on('JIRA_ISSUE_CHANGED', handleIssueChanged);

    return () => {
      events.off('JIRA_ISSUE_CHANGED', handleIssueChanged);
    };
  }, []);

  useEffect(() => {
    if (data) {
      const textSummary = extractText(data.fields).join(' ');
      sendTextSummary(textSummary);
    }
  }, [data]);

  if (!data) {
    return <div>Loading...</div>;
  }

  const extractText = (obj) => {
    // Filter elements under the specified JSON paths

    const descriptionTexts = jsonpath.query(obj, '$.description.content..content..text');
    const commentTexts = jsonpath.query(obj, '$.comment..body..content..content..text');
    const summary = jsonpath.query(obj, '$.summary');

    // Combine and return as an array of strings
    return [...descriptionTexts, ...commentTexts, ...summary];
  };

  return (
    <div>
      {/* Show loading indicator if loading is true */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaSpinner className="spinner" style={{ marginRight: '10px' }} />
          Loading completeness data...
        </div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <>
          {completeness !== null && (
            <div>
              <strong>
                <FaCheckCircle style={{ color: 'green', marginRight: '5px' }} />
                Requirements Completeness:
              </strong> {completeness}%
              <div style={{ width: '100%', backgroundColor: '#e0e0e0' }}>
                <div style={{ width: `${completeness}%`, backgroundColor: '#76c7c0', height: '24px' }}></div>
              </div>
            </div>
          )}
          {recommendations.length > 0 && (
            <div>
              <strong>Recommendations:</strong>
              <ul>
                {recommendations.map((rec, index) => (
                  <li key={index}>
                    <FaCheckCircle style={{ color: 'blue', marginRight: '5px' }} />
                    <strong>{rec.area}:</strong> {rec.suggestion}
                    <br />
                    <em>Example:</em> {rec.example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Add CSS for spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.innerHTML = `
  .spinner {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

export default App;
