import React, { useEffect, useState } from 'react';
import { events, invoke } from '@forge/bridge';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa'; // Add FaSpinner for loading animation

function App() {
  const [data, setData] = useState(null);
  const [completeness, setCompleteness] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

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
    invoke('sendTextSummary', { textSummary })
      .then((response) => {
        setCompleteness(response.completeness);
        setRecommendations(response.recommendations);
        setLoading(false); // Set loading to false when data is received
      })
      .catch((error) => {
        console.error('Failed to send text summary', error);
        setLoading(false); // Set loading to false on error
      });
  };

  useEffect(() => {
    const fetchProperties = () => {
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
    let texts = [];
    const traverse = (item) => {
      if (typeof item === 'string') {
        texts.push(item);
      } else if (Array.isArray(item)) {
        item.forEach(traverse);
      } else if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          if (key === 'text') {
            texts.push(value);
          } else {
            traverse(value);
          }
        });
      }
    };
    traverse(obj);
    return texts;
  };

  return (
    <div>
      {/* Show loading indicator if loading is true */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaSpinner className="spinner" style={{ marginRight: '10px' }} />
          Loading completeness data...
        </div>
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
